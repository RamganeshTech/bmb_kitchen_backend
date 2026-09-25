import OrderModel, { OrderType, PaymentMethod } from "../../models/order_models/order.model.js";
import { ApiError } from "../../utils/apiError.js";

interface ListPaymentsFilters {
  outletId?: string;
  paymentMethod?: PaymentMethod;
  orderType?: OrderType;
  scope?: 'today' | 'week' | 'month' | 'all';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const listPayments = async (organizationId: string, filters: ListPaymentsFilters) => {
  const query: Record<string, any> = {
    organizationId,
    orderStatus: 'completed',
    paymentStatus: 'paid',
  };

  if (filters.outletId) query.outletId = filters.outletId;
  if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
  if (filters.orderType) query.orderType = filters.orderType;

  // Explicit date range wins over scope
  if (filters.from || filters.to) {
    query.paidAt = {};
    if (filters.from) query.paidAt.$gte = new Date(filters.from);
    if (filters.to) query.paidAt.$lte = new Date(filters.to);
  } else {
    const now = new Date();
    if (filters.scope === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      query.paidAt = { $gte: startOfWeek };
    } else if (filters.scope === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.paidAt = { $gte: startOfMonth };
    } else if (filters.scope === 'today' || !filters.scope) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      query.paidAt = { $gte: startOfDay, $lte: endOfDay };
    }
    // scope === 'all' → no paidAt filter
  }

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 200) : 200;
  const skip = (page - 1) * limit;

  const [payments, total, summaryAgg] = await Promise.all([
    OrderModel.find(query)
      .select('billNo orderNo orderType outletId tableId customerId grandTotal taxAmount discountAmount paymentMethod paidAt')
      .populate('outletId', 'name code')
      .populate('customerId', 'name phone')
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit),
    OrderModel.countDocuments(query),
    OrderModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$grandTotal' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const totalCollected = summaryAgg.reduce((sum, m) => sum + m.totalAmount, 0);
  const byMode = summaryAgg.reduce((acc, m) => {
    acc[m._id] = { amount: m.totalAmount, count: m.count };
    return acc;
  }, {} as Record<string, { amount: number; count: number }>);

  return {
    payments,
    total,
    page,
    limit,
    summary: { totalCollected, byMode },
  };
};


export const getPaymentById = async (organizationId: string, orderId: string) => {
  const payment = await OrderModel.findOne({
    _id: orderId,
    organizationId,
    orderStatus: 'completed',
    paymentStatus: 'paid',
  })
    .select('billNo orderNo orderType outletId tableId customerId items subTotal discountAmount taxPercent taxAmount grandTotal loyaltyPointsRedeemed paymentMethod paidAt')
    .populate('outletId', 'name code')
    .populate('customerId', 'name phone')
    .populate('tableId', 'name');

  if (!payment) throw new ApiError(404, 'Payment not found for this order');
  return payment;
};