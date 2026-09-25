import mongoose, { type Types } from 'mongoose';
import OrderModel, { OrderStatus, OrderType, PaymentStatus, type IOrder, type IOrderItem, type ItemKitchenStatus } from '../../models/order_models/order.model.js';
import CustomerModel from '../../models/customer_models/customer.model.js';
import { ApiError } from '../../utils/apiError.js';
import RestaurantTableModel from '../../models/restaurant_table_model/restaurantTable.model.js';
import TaxSettingsModel from '../../models/taxSettings_model/taxSetting.model.js';
import LoyaltyProgramModel from '../../models/loyaltyProgram_model/loyaltyProgram.model.js';

// ── INTERNAL HELPER: CALCULATE TOTALS ─────────────────────────────
// const recalculateTotals = (
//   items: IOrderItem[],
//   discountAmount: number = 0,
//   taxPercent: number = 5
// ) => {
//   const subTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
//   const taxableAmount = Math.max(0, subTotal - discountAmount);
//   const taxAmount = (taxableAmount * taxPercent) / 100;
//   const grandTotal = taxableAmount + taxAmount;

//   return { subTotal, taxAmount, grandTotal };
// };

// ── 1. CREATE ORDER ───────────────────────────────────────────────
export const createOrder = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: {
    tableId?: string;
    customerId?: string;
    outletId?: string;
    orderType: IOrder['orderType'];
    items: Array<Partial<IOrderItem>>;
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

  const taxSettings = await TaxSettingsModel.findOne({ organizationId });

  let taxPercent = 0;
  let serviceChargePercent = 0;

  if (taxSettings) {
    const defaultRate = taxSettings.rates.find((r) => r.isActive) || taxSettings.rates[0];
    if (defaultRate) taxPercent = defaultRate.percentage;

    if (taxSettings.serviceCharge > 0) {
      const isDineIn = data.orderType === 'dine_in';
      if (!isDineIn || taxSettings.scOnDinein) {
        serviceChargePercent = taxSettings.serviceCharge;
      }
    }
  }


  const totals = recalculateTotals(formattedItems as IOrderItem[], 0, taxPercent, 0);


  const newOrder = await OrderModel.create({
    organizationId,
    tableId: data.tableId,
    customerId: data.customerId,
    orderType: data.orderType,
    outletId: data.outletId,
    items: formattedItems,
    subTotal: totals.subTotal,
    taxPercent: taxPercent, // Default tax, could be dynamic
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

// // ── 4. PROCESS CHECKOUT & BILLING (Transactional) ─────────────────
// export const checkoutOrder = async (
//   organizationId: string | Types.ObjectId,
//   orderId: string,
//   userId: string | Types.ObjectId,
//   checkoutData: {
//     paymentMethod: IOrder['paymentMethod'];
//     loyaltyPointsRedeemed: number;
//     manualDiscount: number;
//   }
// ): Promise<IOrder> => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const order = await OrderModel.findOne({ _id: orderId, organizationId }).session(session);
//     if (!order) throw new ApiError(404, 'Order not found');
//     if (order.orderStatus === 'completed') throw new ApiError(400, 'Order is already completed');

//     // Handle Loyalty Points if claimed
//     if (checkoutData.loyaltyPointsRedeemed > 0) {
//       if (!order.customerId) {
//         throw new ApiError(400, 'Cannot redeem loyalty points on a guest order');
//       }

//       const customer = await CustomerModel.findById(order.customerId).session(session);
//       if (!customer || customer.loyaltyPoints < checkoutData.loyaltyPointsRedeemed) {
//         throw new ApiError(400, 'Insufficient loyalty points available');
//       }

//       // Deduct points (1 point = 1 unit of currency logic assumed here)
//       customer.loyaltyPoints -= checkoutData.loyaltyPointsRedeemed;
//       await customer.save({ session });
//     }

//     // Apply combined discounts and recalculate
//     const totalDiscount = checkoutData.loyaltyPointsRedeemed + checkoutData.manualDiscount;
//     const totals = recalculateTotals(order.items, totalDiscount, order.taxPercent);

//     // Generate Unique Bill Number (BILL-2026-0001 format)
//     const currentYear = new Date().getFullYear();
//     const prefix = `BILL-${currentYear}-`;
//     const lastCompletedOrder = await OrderModel.findOne({
//       organizationId,
//       billNo: { $regex: `^${prefix}` },
//     })
//       .sort({ paidAt: -1 })
//       .select('billNo')
//       .session(session)
//       .lean();

//     let nextBillNumber = 1;
//     if (lastCompletedOrder?.billNo) {
//       const lastNumberStr = lastCompletedOrder.billNo.split('-').pop();
//       nextBillNumber = (parseInt(lastNumberStr || '0', 10) || 0) + 1;
//     }
//     const billNo = `${prefix}${String(nextBillNumber).padStart(4, '0')}`;

//     // Update Order state
//     order.loyaltyPointsRedeemed = checkoutData.loyaltyPointsRedeemed;
//     order.discountAmount = totalDiscount;
//     order.subTotal = totals.subTotal;
//     order.taxAmount = totals.taxAmount;
//     order.grandTotal = totals.grandTotal;

//     order.billNo = billNo;
//     order.orderStatus = 'completed';
//     order.paymentStatus = 'paid';
//     order.paymentMethod = checkoutData.paymentMethod;
//     order.paidAt = new Date();
//     order.updatedBy = userId as Types.ObjectId;

//     await order.save({ session });

//     // Update Customer Lifetime Value (if customer exists)
//     if (order.customerId) {
//       await CustomerModel.findByIdAndUpdate(
//         order.customerId,
//         {
//           $inc: { totalSpent: totals.grandTotal, totalVisits: 1 },
//         },
//         { session }
//       );
//     }

//     // TODO: Free up the table by setting Table status back to 'available'

//     // ✅ RESOLVED: Free up the table safely inside the transaction
//     if (order.tableId) {
//       await RestaurantTableModel.findByIdAndUpdate(
//         order.tableId,
//         { $set: { status: 'available' } },
//         { session }
//       );
//     }

//     await session.commitTransaction();
//     session.endSession();

//     return order;
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// };


// Now takes serviceChargePercent too — service charge applies on the taxable
// base (after discount), tax is applied on (taxable + service charge)
function recalculateTotals(
  items: IOrderItem[],
  discountAmount: number,
  taxPercent: number,
  serviceChargePercent: number = 0
) {
  const subTotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
  const taxableAmount = Math.max(subTotal - discountAmount, 0);
  const serviceChargeAmount = (taxableAmount * serviceChargePercent) / 100;
  const taxAmount = ((taxableAmount + serviceChargeAmount) * taxPercent) / 100;
  const grandTotal = taxableAmount + serviceChargeAmount + taxAmount;

  return { subTotal, taxAmount, grandTotal };
}

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
    if (!order.items.length) throw new ApiError(400, 'Cannot checkout an order with no items');

    // ── Tax settings: use the org's configured default slab + service charge ──
    // Falls back to the order's own taxPercent if no TaxSettings doc exists yet.
    const taxSettings = await TaxSettingsModel.findOne({ organizationId }).session(session);

    let taxPercent = order.taxPercent;
    let serviceChargePercent = 0;

    if (taxSettings) {
      const defaultRate = taxSettings.rates.find((r) => r.isActive) || taxSettings.rates[0];
      if (defaultRate) taxPercent = defaultRate.percentage;

      if (taxSettings.serviceCharge > 0) {
        const isDineIn = order.orderType === 'dine_in';
        if (!isDineIn || taxSettings.scOnDinein) {
          serviceChargePercent = taxSettings.serviceCharge;
        }
      }
    }

    // ── Loyalty redemption — real pointValue conversion, real minimum check ──
    let redeemValue = 0;
    let loyaltyProgram = null;

    if (order.customerId) {
      loyaltyProgram = await LoyaltyProgramModel.findOne({ organizationId }).session(session);
    }

    if (checkoutData.loyaltyPointsRedeemed > 0) {
      if (!order.customerId) {
        throw new ApiError(400, 'Cannot redeem loyalty points on a guest order');
      }
      if (!loyaltyProgram || !loyaltyProgram.isEnabled) {
        throw new ApiError(400, 'Loyalty program is not enabled for this organization');
      }

      const customer = await CustomerModel.findById(order.customerId).session(session);
      if (!customer) throw new ApiError(404, 'Customer not found');

      if (customer.loyaltyPoints < loyaltyProgram.minPointsToRedeem) {
        throw new ApiError(
          400,
          `Minimum ${loyaltyProgram.minPointsToRedeem} points required before redeeming`
        );
      }
      if (customer.loyaltyPoints < checkoutData.loyaltyPointsRedeemed) {
        throw new ApiError(400, 'Insufficient loyalty points available');
      }

      redeemValue = checkoutData.loyaltyPointsRedeemed * loyaltyProgram.pointValue;

      customer.loyaltyPoints -= checkoutData.loyaltyPointsRedeemed;
      await customer.save({ session });
    }

    // ── Recalculate totals with real tax %, service charge, and discounts ──
    const totalDiscount = redeemValue + checkoutData.manualDiscount;
    const totals = recalculateTotals(order.items, totalDiscount, taxPercent, serviceChargePercent);

    // ── Generate Unique Bill Number (BILL-2026-0001 format) ──
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

    // ── Update order state ──
    order.loyaltyPointsRedeemed = checkoutData.loyaltyPointsRedeemed;
    order.discountAmount = totalDiscount;
    order.taxPercent = taxPercent;
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

    // ── Award new loyalty points earned on this spend (only if program is on) ──
    if (order.customerId) {
      const pointsEarned =
        loyaltyProgram?.isEnabled && loyaltyProgram.spendPerBlock > 0
          ? Math.floor(totals.grandTotal / loyaltyProgram.spendPerBlock) * loyaltyProgram.pointsPerBlock
          : 0;

      await CustomerModel.findByIdAndUpdate(
        order.customerId,
        {
          $inc: {
            totalSpent: totals.grandTotal,
            totalVisits: 1,
            loyaltyPoints: pointsEarned,
          },
        },
        { session }
      );
    }

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




//  TO FILTER OUT THE TAKEAWAY , ONLINE DELIVERY , IN DINE ORDERS

interface ListOrdersFilters {
  outletId?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  scope?: 'today' | 'running' | 'all';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

const VALID_ORDER_TYPES: (OrderType | 'all')[] = ['dine_in', 'takeaway', 'delivery', 'online', 'all'];

export const listOrdersByType = async (
  organizationId: string,
  orderType: OrderType | 'all',
  filters: ListOrdersFilters
) => {
  if (!VALID_ORDER_TYPES.includes(orderType)) {
    throw new ApiError(400, `Invalid orderType. Must be one of: ${VALID_ORDER_TYPES.join(', ')}`);
  }

  const query: Record<string, any> = { organizationId };

  if (orderType !== 'all') {
    query.orderType = orderType;
  }
  if (filters.outletId) {
    query.outletId = filters.outletId;
  }
  if (filters.paymentStatus) {
    query.paymentStatus = filters.paymentStatus;
  }

  // orderStatus explicitly wins over scope
  if (filters.orderStatus) {
    query.orderStatus = filters.orderStatus;
  } else if (filters.scope === 'running') {
    query.orderStatus = 'active';
  }

  // explicit date range wins over scope="today"
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  } else if (!filters.orderStatus && (filters.scope === 'today' || !filters.scope)) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: startOfDay, $lte: endOfDay };
  }

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 200) : 200;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    OrderModel.find(query)
      .populate('outletId', 'name code')
      .populate('tableId', 'name')
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    OrderModel.countDocuments(query),
  ]);

  return { orders, total, page, limit };
};