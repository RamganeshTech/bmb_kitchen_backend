import mongoose, { type Types } from 'mongoose';
import OrderModel, { type IOrder, type IOrderItem, type ItemKitchenStatus } from '../../models/order_models/order.model.js';
import CustomerModel from '../../models/customer_models/customer.model.js';
import { ApiError } from '../../utils/apiError.js';
import RestaurantTableModel from '../../models/restaurant_table_model/restaurantTable.model.js';

// ── INTERNAL HELPER: CALCULATE TOTALS ─────────────────────────────
const recalculateTotals = (
  items: IOrderItem[],
  discountAmount: number = 0,
  taxPercent: number = 5
) => {
  const subTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxableAmount = Math.max(0, subTotal - discountAmount);
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const grandTotal = taxableAmount + taxAmount;

  return { subTotal, taxAmount, grandTotal };
};

// ── 1. CREATE ORDER ───────────────────────────────────────────────
export const createOrder = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: {
    tableId?: string;
    customerId?: string;
    outletId?:string;
    orderType: IOrder['orderType'];
    items: Array<Partial<IOrderItem>>;
    taxPercent?: number
  }
): Promise<IOrder> => {
  // Format items and calculate their individual totals
  const formattedItems = data.items.map((item) => ({
    menuItemId: item.menuItemId,
    name: item.name,
    price: item.price || 0,
    quantity: item.quantity || 1,
    itemTotal: (item.price || 0) * (item.quantity || 1),
    notes: item.notes || '',
    status: 'in_queue' as ItemKitchenStatus,
    sentToKitchenAt: new Date(),
  }));

  const totals = recalculateTotals(formattedItems as IOrderItem[]);

  const newOrder = await OrderModel.create({
    organizationId,
    tableId: data.tableId,
    customerId: data.customerId,
    orderType: data.orderType,
    outletId: data.outletId,
    items: formattedItems,
    subTotal: totals.subTotal,
    taxPercent: data.taxPercent || 0, // Default tax, could be dynamic
    taxAmount: totals.taxAmount,
    grandTotal: totals.grandTotal,
    createdBy: userId,
  });

  // TODO: If using a Table model, update Table status to 'occupied' here

  if (data.tableId) {
    await RestaurantTableModel.findOneAndUpdate(
      { _id: data.tableId, organizationId },
      { $set: { status: 'occupied' } }
    );
  }

  return newOrder;
};

// ── 2. ADD ITEMS TO EXISTING ORDER ────────────────────────────────
export const addItemsToOrder = async (
  organizationId: string | Types.ObjectId,
  orderId: string,
  userId: string | Types.ObjectId,
  newItems: Array<Partial<IOrderItem>>
): Promise<IOrder> => {
  const order = await OrderModel.findOne({ _id: orderId, organizationId });

  if (!order) throw new ApiError(404, 'Order not found');
  if (order.orderStatus !== 'active') throw new ApiError(400, 'Cannot add items to a completed or cancelled order');

  const formattedNewItems = newItems.map((item) => ({
    menuItemId: item.menuItemId,
    name: item.name,
    price: item.price || 0,
    quantity: item.quantity || 1,
    itemTotal: (item.price || 0) * (item.quantity || 1),
    notes: item.notes || '',
    status: 'in_queue' as ItemKitchenStatus,
    sentToKitchenAt: new Date(),
  }));

  // Push new items
  order.items.push(...(formattedNewItems as any));

  // Recalculate
  const totals = recalculateTotals(order.items, order.discountAmount, order.taxPercent);
  
  order.subTotal = totals.subTotal;
  order.taxAmount = totals.taxAmount;
  order.grandTotal = totals.grandTotal;
  order.updatedBy = userId as Types.ObjectId;

  await order.save();
  return order;
};

// ── 3. UPDATE KITCHEN STATUS ──────────────────────────────────────
export const updateOrderItemStatus = async (
  organizationId: string | Types.ObjectId,
  orderId: string,
  itemId: string,
  userId: string | Types.ObjectId,
  status: ItemKitchenStatus
): Promise<IOrder> => {
  const order = await OrderModel.findOne({ _id: orderId, organizationId });
  
  if (!order) throw new ApiError(404, 'Order not found');

  const item = order.items.find((i) => i._id?.toString() === itemId);
  if (!item) throw new ApiError(404, 'Order item not found');

  item.status = status;
  
  // Track operational timestamps
  if (status === 'ready' && !item.readyAt) {
    item.readyAt = new Date();
  }
  if (status === 'served' && !item.servedAt) {
    item.servedAt = new Date();
  }

  order.updatedBy = userId as Types.ObjectId;
  await order.save();

  return order;
};

// ── 4. PROCESS CHECKOUT & BILLING (Transactional) ─────────────────
export const checkoutOrder = async (
  organizationId: string | Types.ObjectId,
  orderId: string,
  userId: string | Types.ObjectId,
  checkoutData: {
    paymentMethod: IOrder['paymentMethod'];
    loyaltyPointsRedeemed: number;
    manualDiscount: number;
  }
): Promise<IOrder> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await OrderModel.findOne({ _id: orderId, organizationId }).session(session);
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.orderStatus === 'completed') throw new ApiError(400, 'Order is already completed');

    // Handle Loyalty Points if claimed
    if (checkoutData.loyaltyPointsRedeemed > 0) {
      if (!order.customerId) {
        throw new ApiError(400, 'Cannot redeem loyalty points on a guest order');
      }

      const customer = await CustomerModel.findById(order.customerId).session(session);
      if (!customer || customer.loyaltyPoints < checkoutData.loyaltyPointsRedeemed) {
        throw new ApiError(400, 'Insufficient loyalty points available');
      }

      // Deduct points (1 point = 1 unit of currency logic assumed here)
      customer.loyaltyPoints -= checkoutData.loyaltyPointsRedeemed;
      await customer.save({ session });
    }

    // Apply combined discounts and recalculate
    const totalDiscount = checkoutData.loyaltyPointsRedeemed + checkoutData.manualDiscount;
    const totals = recalculateTotals(order.items, totalDiscount, order.taxPercent);

    // Generate Unique Bill Number (BILL-2026-0001 format)
    const currentYear = new Date().getFullYear();
    const prefix = `BILL-${currentYear}-`;
    const lastCompletedOrder = await OrderModel.findOne({
      organizationId,
      billNo: { $regex: `^${prefix}` },
    })
      .sort({ paidAt: -1 })
      .select('billNo')
      .session(session)
      .lean();

    let nextBillNumber = 1;
    if (lastCompletedOrder?.billNo) {
      const lastNumberStr = lastCompletedOrder.billNo.split('-').pop();
      nextBillNumber = (parseInt(lastNumberStr || '0', 10) || 0) + 1;
    }
    const billNo = `${prefix}${String(nextBillNumber).padStart(4, '0')}`;

    // Update Order state
    order.loyaltyPointsRedeemed = checkoutData.loyaltyPointsRedeemed;
    order.discountAmount = totalDiscount;
    order.subTotal = totals.subTotal;
    order.taxAmount = totals.taxAmount;
    order.grandTotal = totals.grandTotal;
    
    order.billNo = billNo;
    order.orderStatus = 'completed';
    order.paymentStatus = 'paid';
    order.paymentMethod = checkoutData.paymentMethod;
    order.paidAt = new Date();
    order.updatedBy = userId as Types.ObjectId;

    await order.save({ session });

    // Update Customer Lifetime Value (if customer exists)
    if (order.customerId) {
      await CustomerModel.findByIdAndUpdate(
        order.customerId,
        {
          $inc: { totalSpent: totals.grandTotal, totalVisits: 1 },
        },
        { session }
      );
    }

    // TODO: Free up the table by setting Table status back to 'available'

    // ✅ RESOLVED: Free up the table safely inside the transaction
    if (order.tableId) {
      await RestaurantTableModel.findByIdAndUpdate(
        order.tableId,
        { $set: { status: 'available' } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return order;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// ── 5. GET ACTIVE ORDERS ──────────────────────────────────────────
export const getActiveOrders = async (
  organizationId: string | Types.ObjectId,
  outletId?: string | Types.ObjectId 
): Promise<IOrder[]> => {
// Explicitly type the query object using Record or FilterQuery
  const query: Record<string, any> = {
    organizationId,
    orderStatus: 'active',
    isActive: true,
  };

  if (outletId) {
    query.outletId = outletId;
  }
  
  return OrderModel.find(query)
    .populate('tableId', 'tableName status') // Assumes Table schema has these fields
    .populate('customerId', 'name phone')
    .sort({ createdAt: -1 });
};

// ── 6. GET ORDER BY ID ────────────────────────────────────────────
export const getOrderById = async (
  organizationId: string | Types.ObjectId,
  orderId: string
): Promise<IOrder> => {
  const order = await OrderModel.findOne({ _id: orderId, organizationId })
    .populate('tableId', 'tableName')
    .populate('customerId', 'name phone loyaltyPoints totalVisits');

  if (!order) throw new ApiError(404, 'Order not found');
  return order;
};

// ── 7. CANCEL ORDER ───────────────────────────────────────────────
export const cancelOrder = async (
  organizationId: string | Types.ObjectId,
  orderId: string,
  userId: string | Types.ObjectId
): Promise<IOrder> => {
  const order = await OrderModel.findOne({ _id: orderId, organizationId });
  
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.orderStatus === 'completed') {
    throw new ApiError(400, 'Cannot cancel a completed/paid order');
  }

  order.orderStatus = 'cancelled';
  order.updatedBy = userId as Types.ObjectId;

  // Mark all pending items as cancelled
  order.items.forEach((item) => {
    if (item.status === 'in_queue' || item.status === 'preparing') {
      item.status = 'cancelled';
    }
  });

  // TODO: Free up the table by setting Table status back to 'available'

  // ✅ RESOLVED: Free up the table on cancellation
  if (order.tableId) {
    await RestaurantTableModel.findOneAndUpdate(
      { _id: order.tableId, organizationId },
      { $set: { status: 'available' } }
    );
  }

  await order.save();
  return order;
};