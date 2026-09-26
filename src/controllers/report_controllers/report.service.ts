import { Types } from 'mongoose';
import { resolveDateRange, ReportScope } from './report-filters.util.js';
import OrderModel from '../../models/order_models/order.model.js';
import ExpenseModel from '../../models/expense_model/expense.model.js';
import TaxSettingsModel from '../../models/taxSettings_model/taxSetting.model.js';

interface BaseFilters {
  outletId?: string;
  scope?: ReportScope;
  from?: string;
  to?: string;
}

// ── 1. SALES REPORT ─────────────────────────────────────────────────
export const getSalesReport = async (organizationId: string, filters: BaseFilters) => {
  const { start, end } = resolveDateRange(filters.scope, filters.from, filters.to);

  const match: Record<string, any> = {
    organizationId: new Types.ObjectId(organizationId),
    orderStatus: 'completed',
    paymentStatus: 'paid',
    paidAt: { $gte: start, $lte: end },
  };
  if (filters.outletId) match.outletId = new Types.ObjectId(filters.outletId);

  const cancelledMatch: Record<string, any> = {
    organizationId: new Types.ObjectId(organizationId),
    orderStatus: 'cancelled',
    createdAt: { $gte: start, $lte: end },
  };
  if (filters.outletId) cancelledMatch.outletId = new Types.ObjectId(filters.outletId);

  const [summaryAgg, orderTypeAgg, dailyTrend, cancelledCount] = await Promise.all([
    OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          grossSales: { $sum: '$grandTotal' },
          taxableValue: { $sum: { $subtract: ['$subTotal', '$discountAmount'] } },
          totalDiscounts: { $sum: '$discountAmount' },
          totalGST: { $sum: '$taxAmount' },
          totalBills: { $sum: 1 },
        },
      },
    ]),
    OrderModel.aggregate([
      { $match: match },
      { $group: { _id: '$orderType', amount: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
    ]),
    OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          sales: { $sum: '$grandTotal' },
          bills: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    OrderModel.countDocuments(cancelledMatch),
  ]);

  const summary = summaryAgg[0] || {
    grossSales: 0,
    taxableValue: 0,
    totalDiscounts: 0,
    totalGST: 0,
    totalBills: 0,
  };

  const orderTypeSplit = orderTypeAgg.reduce((acc, o) => {
    acc[o._id] = { amount: o.amount, count: o.count };
    return acc;
  }, {} as Record<string, { amount: number; count: number }>);

  return {
    range: { from: start, to: end },
    grossSales: summary.grossSales,
    taxableValue: summary.taxableValue,
    totalDiscounts: summary.totalDiscounts,
    totalGST: summary.totalGST,
    totalBills: summary.totalBills,
    avgBillValue: summary.totalBills ? summary.grossSales / summary.totalBills : 0,
    cancelledOrders: cancelledCount,
    orderTypeSplit,
    dailyTrend: dailyTrend.map((d) => ({ date: d._id, sales: d.sales, bills: d.bills })),
  };
};

// ── 2. ITEM-WISE SALES REPORT ───────────────────────────────────────
export const getItemSalesReport = async (organizationId: string, filters: BaseFilters) => {
  const { start, end } = resolveDateRange(filters.scope, filters.from, filters.to);

  const match: Record<string, any> = {
    organizationId: new Types.ObjectId(organizationId),
    orderStatus: 'completed',
    paymentStatus: 'paid',
    paidAt: { $gte: start, $lte: end },
  };
  if (filters.outletId) match.outletId = new Types.ObjectId(filters.outletId);

  const items = await OrderModel.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuItemId',
        name: { $first: '$items.name' },
        qtySold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.itemTotal' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  const topRevenue = items[0]?.revenue || 1;

  return {
    range: { from: start, to: end },
    items: items.map((i, idx) => ({
      rank: idx + 1,
      menuItemId: i._id,
      name: i.name,
      qtySold: i.qtySold,
      revenue: i.revenue,
      sharePercent: Math.round((i.revenue / topRevenue) * 1000) / 10,
    })),
  };
};

// ── 3. EXPENSE REPORT ────────────────────────────────────────────────
export const getExpenseReport = async (
  organizationId: string,
  filters: BaseFilters & { category?: string }
) => {
  const { start, end } = resolveDateRange(filters.scope, filters.from, filters.to);

  const match: Record<string, any> = {
    organizationId: new Types.ObjectId(organizationId),
    isActive: true,
    date: { $gte: start, $lte: end },
  };
  if (filters.outletId) match.outletId = new Types.ObjectId(filters.outletId);
  if (filters.category) match.category = filters.category;

  const [summaryAgg, byCategory, byPaymentMode] = await Promise.all([
    ExpenseModel.aggregate([
      { $match: match },
      { $group: { _id: null, totalExpenses: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    ExpenseModel.aggregate([
      { $match: match },
      { $group: { _id: '$category', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]),
    ExpenseModel.aggregate([
      { $match: match },
      { $group: { _id: '$paymentMode', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]),
  ]);

  const summary = summaryAgg[0] || { totalExpenses: 0, count: 0 };

  return {
    range: { from: start, to: end },
    totalExpenses: summary.totalExpenses,
    totalEntries: summary.count,
    byCategory: byCategory.map((c) => ({ category: c._id, amount: c.amount, count: c.count })),
    byPaymentMode: byPaymentMode.map((p) => ({ mode: p._id, amount: p.amount, count: p.count })),
  };
};

// ── 4. PAYMENT MODE / SOURCE REPORT ─────────────────────────────────
export const getPaymentModeReport = async (organizationId: string, filters: BaseFilters) => {
  const { start, end } = resolveDateRange(filters.scope, filters.from, filters.to);

  const match: Record<string, any> = {
    organizationId: new Types.ObjectId(organizationId),
    orderStatus: 'completed',
    paymentStatus: 'paid',
    paidAt: { $gte: start, $lte: end },
  };
  if (filters.outletId) match.outletId = new Types.ObjectId(filters.outletId);

  const [byMode, byOrderType] = await Promise.all([
    OrderModel.aggregate([
      { $match: match },
      { $group: { _id: '$paymentMethod', amount: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]),
    // Order "source" isn't tracked as its own field yet — orderType is used as a stand-in
    OrderModel.aggregate([
      { $match: match },
      { $group: { _id: '$orderType', amount: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]),
  ]);

  const totalCollected = byMode.reduce((sum, m) => sum + m.amount, 0);

  return {
    range: { from: start, to: end },
    totalCollected,
    byMode: byMode.map((m) => ({
      mode: m._id,
      amount: m.amount,
      count: m.count,
      sharePercent: totalCollected ? Math.round((m.amount / totalCollected) * 1000) / 10 : 0,
    })),
    byOrderType: byOrderType.map((o) => ({ orderType: o._id, amount: o.amount, count: o.count })),
  };
};

// ── 5. GST SUMMARY ───────────────────────────────────────────────────
export const getGstSummary = async (
  organizationId: string,
  filters: BaseFilters & { page?: number; limit?: number }
) => {
  const { start, end } = resolveDateRange(filters.scope, filters.from, filters.to);

  const match: Record<string, any> = {
    organizationId: new Types.ObjectId(organizationId),
    orderStatus: 'completed',
    paymentStatus: 'paid',
    paidAt: { $gte: start, $lte: end },
  };
  if (filters.outletId) match.outletId = new Types.ObjectId(filters.outletId);

  const taxSettings = await TaxSettingsModel.findOne({ organizationId });
  const defaultRate = taxSettings?.rates.find((r) => r.isActive) || taxSettings?.rates[0];

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 200) : 50;
  const skip = (page - 1) * limit;

  const [summaryAgg, bills, total] = await Promise.all([
    OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          taxableValue: { $sum: { $subtract: ['$subTotal', '$discountAmount'] } },
          totalGST: { $sum: '$taxAmount' },
        },
      },
    ]),
    OrderModel.find(match)
      .select('billNo orderNo paidAt subTotal discountAmount taxAmount grandTotal')
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit),
    OrderModel.countDocuments(match),
  ]);

  const summary = summaryAgg[0] || { taxableValue: 0, totalGST: 0 };

  return {
    range: { from: start, to: end },
    gstRatePercent: defaultRate?.percentage ?? null,
    taxableValue: summary.taxableValue,
    cgst: summary.totalGST / 2,
    sgst: summary.totalGST / 2,
    totalGST: summary.totalGST,
    page,
    limit,
    total,
    bills: bills.map((o) => {
      const taxable = o.subTotal - o.discountAmount;
      return {
        billNo: o.billNo,
        orderNo: o.orderNo,
        paidAt: o.paidAt,
        subTotal: o.subTotal,
        discountAmount: o.discountAmount,
        taxableValue: taxable,
        cgst: o.taxAmount / 2,
        sgst: o.taxAmount / 2,
        grandTotal: o.grandTotal,
      };
    }),
  };
};