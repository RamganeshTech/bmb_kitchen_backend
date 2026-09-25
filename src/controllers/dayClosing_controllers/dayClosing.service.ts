import { Types } from 'mongoose';
import { ApiError } from '../../utils/apiError.js';
import OrderModel from '../../models/order_models/order.model.js';
import ExpenseModel from '../../models/expense_model/expense.model.js';
import DayClosingModel from '../../models/dayClosing_model/dayClosing.model.js';

function getDayRange(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00.000`);
  const end = new Date(`${dateStr}T23:59:59.999`);
  if (isNaN(start.getTime())) {
    throw new ApiError(400, 'closingDate must be a valid date in YYYY-MM-DD format');
  }
  return { start, end };
}

// ── "Today's summary" — pulled live from Orders + Expenses ─────────
export const getDaySnapshot = async (organizationId: string, outletId: string, date: string) => {
  const { start, end } = getDayRange(date);
  const orgId = new Types.ObjectId(organizationId);
  const outId = new Types.ObjectId(outletId);

  const [salesAgg, cancelledOrders, expenseAgg] = await Promise.all([
    OrderModel.aggregate([
      {
        $match: {
          organizationId: orgId,
          outletId: outId,
          orderStatus: 'completed',
          paidAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          discountsGiven: { $sum: '$discountAmount' },
          billsSettled: { $sum: 1 },
          cashSales: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$grandTotal', 0] } },
          upiSales: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'upi'] }, '$grandTotal', 0] } },
          cardSales: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'card'] }, '$grandTotal', 0] } },
        },
      },
    ]),
    OrderModel.countDocuments({
      organizationId: orgId,
      outletId: outId,
      orderStatus: 'cancelled',
      createdAt: { $gte: start, $lte: end },
    }),
    ExpenseModel.aggregate([
      {
        $match: {
          organizationId: orgId,
          outletId: outId,
          isActive: true,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalExpensesToday: { $sum: '$amount' },
          cashExpensesPaidOut: {
            $sum: { $cond: [{ $eq: ['$paymentMode', 'Cash'] }, '$amount', 0] },
          },
        },
      },
    ]),
  ]);

  const sales = salesAgg[0] || {
    totalSales: 0,
    discountsGiven: 0,
    billsSettled: 0,
    cashSales: 0,
    upiSales: 0,
    cardSales: 0,
  };
  const expenses = expenseAgg[0] || { totalExpensesToday: 0, cashExpensesPaidOut: 0 };

  const expectedCash = sales.cashSales - expenses.cashExpensesPaidOut;

  return {
    outletId,
    closingDate: date,
    totalSales: sales.totalSales,
    cashSales: sales.cashSales,
    upiSales: sales.upiSales,
    cardSales: sales.cardSales,
    onlinePaid: 0, // no 'online' payment mode in current Order schema
    creditAmount: 0, // no 'credit' payment mode in current Order schema
    discountsGiven: sales.discountsGiven,
    cashExpensesPaidOut: expenses.cashExpensesPaidOut,
    totalExpensesToday: expenses.totalExpensesToday,
    billsSettled: sales.billsSettled,
    cancelledOrders,
    expectedCash,
  };
};

export const createDayClosing = async (
  organizationId: string,
  userId: string,
  payload: { outletId: string; closingDate: string; actualCash: number; note?: string }
) => {
  const { outletId, closingDate, actualCash, note } = payload;

  if (!outletId || !closingDate) {
    throw new ApiError(400, 'outletId and closingDate are required');
  }
  if (actualCash === undefined || actualCash === null) {
    throw new ApiError(400, 'actualCash is required');
  }

  const existing = await DayClosingModel.findOne({ organizationId, outletId, closingDate });
  if (existing) {
    throw new ApiError(409, `Day closing already submitted for ${closingDate}`);
  }

  const snapshot = await getDaySnapshot(organizationId, outletId, closingDate);
  const difference = Math.round((actualCash - snapshot.expectedCash) * 100) / 100;

  const closing = await DayClosingModel.create({
    organizationId,
    outletId,
    closingDate,
    totalSales: snapshot.totalSales,
    cashSales: snapshot.cashSales,
    upiSales: snapshot.upiSales,
    cardSales: snapshot.cardSales,
    onlinePaid: snapshot.onlinePaid,
    creditAmount: snapshot.creditAmount,
    discountsGiven: snapshot.discountsGiven,
    cashExpensesPaidOut: snapshot.cashExpensesPaidOut,
    totalExpensesToday: snapshot.totalExpensesToday,
    billsSettled: snapshot.billsSettled,
    cancelledOrders: snapshot.cancelledOrders,
    expectedCash: snapshot.expectedCash,
    actualCash,
    difference,
    closedBy: userId,
    note: note || '',
    createdBy: userId,
  });

  return closing;
};

export const getClosingByDate = async (organizationId: string, outletId: string, closingDate: string) => {
  const closing = await DayClosingModel.findOne({ organizationId, outletId, closingDate })
    .populate('closedBy', 'name')
    .populate('outletId', 'name code');

  if (!closing) throw new ApiError(404, 'No day closing found for this date');
  return closing;
};

export const listClosingHistory = async (organizationId: string, outletId: string, limit = 10) => {
  return DayClosingModel.find({ organizationId, outletId })
    .populate('closedBy', 'name')
    .sort({ closingDate: -1 })
    .limit(limit);
};

export const reopenDayClosing = async (
  organizationId: string,
  userId: string,
  id: string,
  reason?: string
) => {
  const closing = await DayClosingModel.findOne({ _id: id, organizationId });
  if (!closing) throw new ApiError(404, 'Day closing not found');
  if (closing.status === 'reopened') {
    throw new ApiError(400, 'Day closing is already reopened');
  }

  closing.status = 'reopened';
  closing.reopenedBy = new Types.ObjectId(userId);
  closing.reopenedAt = new Date();
  closing.reopenReason = reason || null;
  closing.updatedBy = new Types.ObjectId(userId);
  await closing.save();

  return closing;
};