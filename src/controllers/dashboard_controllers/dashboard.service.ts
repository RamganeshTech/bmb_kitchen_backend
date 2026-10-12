// import { Types } from 'mongoose';
// import OrderModel from '../../models/order_models/order.model.js';
// import ExpenseModel from '../../models/expense_model/expense.model.js';
// import RestaurantTableModel from '../../models/restaurant_table_model/restaurantTable.model.js';
// import DayClosingModel from '../../models/dayClosing_model/dayClosing.model.js';
// import { InventoryModel } from '../../models/inventory_model/Inventory.model.js';
// import { parseDateIST, todayIST } from '../report_controllers/report-filters.util.js';
// import { ApiError } from '../../utils/apiError.js';
// import { DAY_MS } from '../../utils/dateRange.js';
// import { IST_OFFSET_MS } from '../../constants/constants.js';

// /**
//  * Resolves the start/end Date boundaries for a single calendar day.
//  * Every dashboard widget is scoped to one day (defaults to today, matching
//  * the HTML's dashboard which is always "today" — no historic scrolling).
//  */
// function resolveDayRange(dateStr?: string) {
//   // const day = dateStr || new Date().toISOString().slice(0, 10);
//   // const start = new Date(`${day}T00:00:00.000`);
//   // const end = new Date(`${day}T23:59:59.999`);
//   // return { day, start, end };
//   const day = dateStr || todayIST();
//   const start = parseDateIST(day);
//   if (!start) throw new ApiError(400, 'date must be a valid date (YYYY-MM-DD)');
//   const end = new Date(start.getTime() + DAY_MS - 1);
//   return { day, start, end };
// }
// function previousDay(dateStr: string) {
//   const start = parseDateIST(dateStr);
//   if (!start) throw new ApiError(400, 'date must be a valid date (YYYY-MM-DD)');
//   return new Date(start.getTime() - DAY_MS + IST_OFFSET_MS).toISOString().slice(0, 10);
// }

// function percentDelta(current: number, previous: number) {
//   if (!previous) return null; // matches the HTML: no "vs yesterday" badge shown when yesterday was 0
//   return Math.round(((current - previous) / previous) * 1000) / 10;
// }

// /**
//  * WIDGET: Top KPI row — "Total sales", "Orders", "Average bill", "Expenses today"
//  * Pulls today's completed+paid orders and today's expenses, each compared
//  * against yesterday's same figures for the up/down % badge.
//  */
// export const getSalesKpis = async (organizationId: string, outletId: string, date?: string) => {
//   const { day, start, end } = resolveDayRange(date);
//   const yDay = previousDay(day);
//   const { start: yStart, end: yEnd } = resolveDayRange(yDay);

//   const orgId = new Types.ObjectId(organizationId);
//   const outId = new Types.ObjectId(outletId);

//   const buildMatch = (s: Date, e: Date) => ({
//     organizationId: orgId,
//     outletId: outId,
//     orderStatus: 'completed',
//     paymentStatus: 'paid',
//     paidAt: { $gte: s, $lte: e },
//   });

//   const [todayAgg, yesterdayAgg, todayExpenseAgg] = await Promise.all([
//     OrderModel.aggregate([
//       { $match: buildMatch(start, end) },
//       { $group: { _id: null, sales: { $sum: '$grandTotal' }, orders: { $sum: 1 } } },
//     ]),
//     OrderModel.aggregate([
//       { $match: buildMatch(yStart, yEnd) },
//       { $group: { _id: null, sales: { $sum: '$grandTotal' }, orders: { $sum: 1 } } },
//     ]),
//     ExpenseModel.aggregate([
//       { $match: { organizationId: orgId, outletId: outId, isActive: true, date: { $gte: start, $lte: end } } },
//       { $group: { _id: null, total: { $sum: '$amount' } } },
//     ]),
//   ]);

//   const today = todayAgg[0] || { sales: 0, orders: 0 };
//   const yesterday = yesterdayAgg[0] || { sales: 0, orders: 0 };
//   const expensesToday = todayExpenseAgg[0]?.total || 0;

//   const avgBill = today.orders ? today.sales / today.orders : 0;
//   const yAvgBill = yesterday.orders ? yesterday.sales / yesterday.orders : 0;

//   return {
//     totalSales: today.sales,
//     orders: today.orders,
//     avgBillValue: avgBill,
//     expensesToday,
//     deltaVsYesterday: {
//       salesPercent: percentDelta(today.sales, yesterday.sales),
//       ordersPercent: percentDelta(today.orders, yesterday.orders),
//       avgBillPercent: percentDelta(avgBill, yAvgBill),
//     },
//   };
// };

// /**
//  * WIDGET: "Sales by hour" spark chart
//  * Returns a 24-length array (index 0 = 12 AM ... 23 = 11 PM), each value
//  * being total grandTotal collected in that hour of the selected day.
//  */
// export const getSalesByHour = async (organizationId: string, outletId: string, date?: string) => {
//   const { start, end } = resolveDayRange(date);

//   const rows = await OrderModel.aggregate([
//     {
//       $match: {
//         organizationId: new Types.ObjectId(organizationId),
//         outletId: new Types.ObjectId(outletId),
//         orderStatus: 'completed',
//         paymentStatus: 'paid',
//         paidAt: { $gte: start, $lte: end },
//       },
//     },
//     {
//       $group: {
//         _id: { $hour: '$paidAt' },
//         sales: { $sum: '$grandTotal' },
//       },
//     },
//   ]);

//   const hours = new Array(24).fill(0);
//   rows.forEach((r) => {
//     hours[r._id] = r.sales;
//   });

//   return hours;
// };

// /**
//  * WIDGET: "Kitchen ticket status" donut
//  * The HTML tracks separate KOT tickets with statuses new/accepted/preparing/
//  * ready/completed/cancelled. This backend has no separate KOT collection —
//  * status lives per order-item (in_queue/preparing/ready/served/cancelled) —
//  * so we bucket item statuses into the same 4 groups the donut shows:
//  * in_queue + preparing → "preparing", ready → "ready", served → "completed".
//  */
// export const getKitchenTicketStatus = async (
//   organizationId: string,
//   outletId: string,
//   date?: string
// ) => {
//   const { start, end } = resolveDayRange(date);

//   const rows = await OrderModel.aggregate([
//     {
//       $match: {
//         organizationId: new Types.ObjectId(organizationId),
//         outletId: new Types.ObjectId(outletId),
//         createdAt: { $gte: start, $lte: end },
//       },
//     },
//     { $unwind: '$items' },
//     { $group: { _id: '$items.status', count: { $sum: 1 } } },
//   ]);

//   const raw = rows.reduce((acc, r) => {
//     acc[r._id] = r.count;
//     return acc;
//   }, {} as Record<string, number>);

//   const completed = raw.served || 0;
//   const preparing = (raw.in_queue || 0) + (raw.preparing || 0);
//   const ready = raw.ready || 0;
//   const cancelled = raw.cancelled || 0;

//   return { completed, preparing, ready, cancelled, total: completed + preparing + ready + cancelled };
// };

// /**
//  * WIDGET: "Top selling items" table
//  * Ranks menu items by quantity sold today, defaulting to the top 5 shown
//  * in the HTML — limit is adjustable via query param.
//  */
// export const getTopSellingItems = async (
//   organizationId: string,
//   outletId: string,
//   date?: string,
//   limit = 5
// ) => {
//   const { start, end } = resolveDayRange(date);

//   return OrderModel.aggregate([
//     {
//       $match: {
//         organizationId: new Types.ObjectId(organizationId),
//         outletId: new Types.ObjectId(outletId),
//         orderStatus: 'completed',
//         paymentStatus: 'paid',
//         paidAt: { $gte: start, $lte: end },
//       },
//     },
//     { $unwind: '$items' },
//     {
//       $group: {
//         _id: '$items.menuItemId',
//         name: { $first: '$items.name' },
//         qty: { $sum: '$items.quantity' },
//         amount: { $sum: '$items.itemTotal' },
//       },
//     },
//     { $sort: { qty: -1 } },
//     { $limit: limit },
//   ]);
// };

// /**
//  * WIDGET: "Payment summary" — collection by mode + total collected today
//  */
// export const getPaymentSummary = async (organizationId: string, outletId: string, date?: string) => {
//   const { start, end } = resolveDayRange(date);

//   const rows = await OrderModel.aggregate([
//     {
//       $match: {
//         organizationId: new Types.ObjectId(organizationId),
//         outletId: new Types.ObjectId(outletId),
//         orderStatus: 'completed',
//         paymentStatus: 'paid',
//         paidAt: { $gte: start, $lte: end },
//       },
//     },
//     { $group: { _id: '$paymentMethod', amount: { $sum: '$grandTotal' } } },
//   ]);

//   const totalCollected = rows.reduce((sum, r) => sum + r.amount, 0);

//   return {
//     byMode: rows.map((r) => ({
//       mode: r._id,
//       amount: r.amount,
//       sharePercent: totalCollected ? Math.round((r.amount / totalCollected) * 1000) / 10 : 0,
//     })),
//     totalCollected,
//   };
// };

// /**
//  * WIDGET: The 4 clickable quick-stat cards — Tables, Kitchen queue,
//  * Low stock, Day closing.
//  */
// export const getQuickStats = async (organizationId: string, outletId: string, date?: string) => {
//   const { day, start, end } = resolveDayRange(date);

//   const orgId = new Types.ObjectId(organizationId);
//   const outId = new Types.ObjectId(outletId);

//   const [tablesTotal, tablesOccupied, kitchenQueueAgg, lowStockItems, closing] = await Promise.all([
//     RestaurantTableModel.countDocuments({ organizationId: orgId, outletId: outId, isActive: true }),
//     RestaurantTableModel.countDocuments({
//       organizationId: orgId,
//       outletId: outId,
//       status: 'occupied',
//     }),
//     OrderModel.aggregate([
//       {
//         $match: {
//           organizationId: orgId,
//           outletId: outId,
//           createdAt: { $gte: start, $lte: end },
//         },
//       },
//       { $unwind: '$items' },
//       { $match: { 'items.status': { $in: ['in_queue', 'preparing'] } } },
//       { $count: 'count' },
//     ]),
//     // low stock = current inStock at or below the configured minLevel
//     InventoryModel.find({
//       organizationId: orgId,
//       $expr: { $lte: ['$inStock', '$minLevel'] },
//     })
//       .select('material')
//       .limit(5),
//     DayClosingModel.findOne({ organizationId: orgId, outletId: outId, closingDate: day }),
//   ]);

//   return {
//     tablesOccupied,
//     tablesTotal,
//     kitchenQueueCount: kitchenQueueAgg[0]?.count || 0,
//     lowStockCount: lowStockItems.length,
//     lowStockPreview: lowStockItems.slice(0, 2).map((i) => i.material),
//     dayClosingStatus: closing ? 'Submitted' : 'Pending',
//     dayClosingDifference: closing ? closing.difference : null,
//   };
// };

// /**
//  * ORCHESTRATOR — composes every widget above into the single payload the
//  * Dashboard screen needs on load, matching VIEWS.dashboard in the HTML
//  * exactly (one screen, one data fetch). Individual widget functions above
//  * remain independently exported/reusable if the frontend later wants to
//  * lazy-load or refresh sections separately.
//  */
// export const getDashboardSummary = async (organizationId: string, outletId: string, date?: string) => {
//   const [salesKpis, salesByHour, kitchenTicketStatus, topSellingItems, paymentSummary, quickStats] =
//     await Promise.all([
//       getSalesKpis(organizationId, outletId, date),
//       getSalesByHour(organizationId, outletId, date),
//       getKitchenTicketStatus(organizationId, outletId, date),
//       getTopSellingItems(organizationId, outletId, date, 5),
//       getPaymentSummary(organizationId, outletId, date),
//       getQuickStats(organizationId, outletId, date),
//     ]);

//   return {
//     // date: date || new Date().toISOString().slice(0, 10),
//     date: date || todayIST,
//     salesKpis,
//     salesByHour,
//     kitchenTicketStatus,
//     topSellingItems,
//     paymentSummary,
//     quickStats,
//   };
// };  




import { Types } from 'mongoose';
import OrderModel from '../../models/order_models/order.model.js';
import ExpenseModel from '../../models/expense_model/expense.model.js';
import RestaurantTableModel from '../../models/restaurant_table_model/restaurantTable.model.js';
import DayClosingModel from '../../models/dayClosing_model/dayClosing.model.js';
import { InventoryModel } from '../../models/inventory_model/Inventory.model.js';
import { ReportScope, resolveDateRange, todayIST } from '../report_controllers/report-filters.util.js';
import { DAY_MS } from '../../utils/dateRange.js';
import { DEFAULT_TIMEZONE, IST_OFFSET_MS } from '../../constants/constants.js';

// ── Filters & shared helpers ─────────────────────────────────────────────────
export interface DashboardFilters {
  scope?: ReportScope; // today | week | month | year | custom  (defaults to today)
  from?: string; // YYYY-MM-DD, used with scope=custom
  to?: string; // YYYY-MM-DD, used with scope=custom
  limit?: number; // top-selling items only
}

/** Resolves the selected period. Same util the Reports module uses, so both screens agree. */
const resolvePeriod = (filters: DashboardFilters = {}) =>
  resolveDateRange(filters.scope ?? 'today', filters.from, filters.to);

/**
 * The period immediately before the selected one, with the same length
 * (e.g. this week -> last 7 days before it). Used for the "vs previous period" badges.
 */
function previousPeriod(start: Date, end: Date) {
  const spanMs = end.getTime() - start.getTime() + 1;
  return {
    start: new Date(start.getTime() - spanMs),
    end: new Date(start.getTime() - 1),
  };
}

function percentDelta(current: number, previous: number) {
  if (!previous) return null; // no badge when the previous period had nothing to compare to
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Completed + paid orders of one outlet, paid inside [start, end]. */
const paidOrdersMatch = (organizationId: string, outletId: string, start: Date, end: Date) => ({
  organizationId: new Types.ObjectId(organizationId),
  outletId: new Types.ObjectId(outletId),
  orderStatus: 'completed',
  paymentStatus: 'paid',
  paidAt: { $gte: start, $lte: end },
});

// ── 1. SALES KPIs ────────────────────────────────────────────────────────────
/**
 * WIDGET: Top KPI row — Total sales, Orders, Average bill, Expenses
 * for the selected period, each compared with the previous period of equal length.
 */
export const getSalesKpis = async (
  organizationId: string,
  outletId: string,
  filters: DashboardFilters = {}
) => {
  const { start, end } = resolvePeriod(filters);
  const { start: prevStart, end: prevEnd } = previousPeriod(start, end);

  const orgId = new Types.ObjectId(organizationId);
  const outId = new Types.ObjectId(outletId);

  const salesGroup = { $group: { _id: null, sales: { $sum: '$grandTotal' }, orders: { $sum: 1 } } };
  const expenseGroup = { $group: { _id: null, total: { $sum: '$amount' } } };
  const expenseMatch = (s: Date, e: Date) => ({
    organizationId: orgId,
    outletId: outId,
    isActive: true,
    date: { $gte: s, $lte: e },
  });

  const [currentAgg, previousAgg, currentExpenseAgg, previousExpenseAgg] = await Promise.all([
    OrderModel.aggregate([{ $match: paidOrdersMatch(organizationId, outletId, start, end) }, salesGroup]),
    OrderModel.aggregate([
      { $match: paidOrdersMatch(organizationId, outletId, prevStart, prevEnd) },
      salesGroup,
    ]),
    ExpenseModel.aggregate([{ $match: expenseMatch(start, end) }, expenseGroup]),
    ExpenseModel.aggregate([{ $match: expenseMatch(prevStart, prevEnd) }, expenseGroup]),
  ]);

  const current = currentAgg[0] || { sales: 0, orders: 0 };
  const previous = previousAgg[0] || { sales: 0, orders: 0 };
  const expenses = currentExpenseAgg[0]?.total || 0;
  const previousExpenses = previousExpenseAgg[0]?.total || 0;

  const avgBill = current.orders ? current.sales / current.orders : 0;
  const previousAvgBill = previous.orders ? previous.sales / previous.orders : 0;

  return {
    range: { from: start, to: end },
    totalSales: current.sales,
    orders: current.orders,
    avgBillValue: avgBill,
    expenses,
    deltaVsPrevious: {
      salesPercent: percentDelta(current.sales, previous.sales),
      ordersPercent: percentDelta(current.orders, previous.orders),
      avgBillPercent: percentDelta(avgBill, previousAvgBill),
      expensesPercent: percentDelta(expenses, previousExpenses),
    },
  };
};

// ── 2. SALES TREND ───────────────────────────────────────────────────────────
type TrendGranularity = 'hour' | 'day' | 'month';

/**
 * today / a single custom day  -> per hour
 * up to ~3 months              -> per day   (week, month, short custom ranges)
 * longer (year, long custom)   -> per month
 */
function pickGranularity(start: Date, end: Date): TrendGranularity {
  const spanDays = (end.getTime() - start.getTime() + 1) / DAY_MS;
  if (spanDays <= 1) return 'hour';
  if (spanDays <= 92) return 'day';
  return 'month';
}

/** Every bucket key in the range (IST), so days/months with no sales still show as 0. */
function buildBucketKeys(granularity: TrendGranularity, start: Date, end: Date): string[] {
  if (granularity === 'hour') {
    return Array.from({ length: 24 }, (_, hour) => String(hour));
  }

  const keys = new Set<string>();

  if (granularity === 'day') {
    for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
      keys.add(new Date(t + IST_OFFSET_MS).toISOString().slice(0, 10));
    }
    return Array.from(keys);
  }

  const startIst = new Date(start.getTime() + IST_OFFSET_MS);
  const endIst = new Date(end.getTime() + IST_OFFSET_MS);
  let year = startIst.getUTCFullYear();
  let month = startIst.getUTCMonth();
  const endYear = endIst.getUTCFullYear();
  const endMonth = endIst.getUTCMonth();

  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.add(`${year}-${String(month + 1).padStart(2, '0')}`);
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return Array.from(keys);
}

/**
 * WIDGET: Sales trend chart (replaces the old "sales by hour").
 * Bucket size adapts to the selected period — see pickGranularity.
 * Keys: hour -> "0".."23", day -> "YYYY-MM-DD", month -> "YYYY-MM".
 */
export const getSalesTrend = async (
  organizationId: string,
  outletId: string,
  filters: DashboardFilters = {}
) => {
  const { start, end } = resolvePeriod(filters);
  const granularity = pickGranularity(start, end);

  const bucketId =
    granularity === 'hour'
      ? { $toString: { $hour: { date: '$paidAt', timezone: DEFAULT_TIMEZONE } } }
      : {
          $dateToString: {
            format: granularity === 'day' ? '%Y-%m-%d' : '%Y-%m',
            date: '$paidAt',
            timezone: DEFAULT_TIMEZONE,
          },
        };

  const rows = await OrderModel.aggregate([
    { $match: paidOrdersMatch(organizationId, outletId, start, end) },
    {
      $group: {
        _id: bucketId,
        sales: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
  ]);

  const totalsByKey = new Map<string, { sales: number; orders: number }>(
    rows.map((row) => [row._id as string, { sales: row.sales, orders: row.orders }])
  );

  const points = buildBucketKeys(granularity, start, end).map((key) => ({
    key,
    sales: totalsByKey.get(key)?.sales ?? 0,
    orders: totalsByKey.get(key)?.orders ?? 0,
  }));

  return { range: { from: start, to: end }, granularity, points };
};

// ── 3. KITCHEN TICKET STATUS ─────────────────────────────────────────────────
/**
 * WIDGET: Kitchen ticket status donut — item statuses of orders created in the period.
 * There is no separate KOT collection, so item statuses are bucketed:
 * in_queue + preparing -> "preparing", ready -> "ready", served -> "completed".
 */
export const getKitchenTicketStatus = async (
  organizationId: string,
  outletId: string,
  filters: DashboardFilters = {}
) => {
  const { start, end } = resolvePeriod(filters);

  const rows = await OrderModel.aggregate([
    {
      $match: {
        organizationId: new Types.ObjectId(organizationId),
        outletId: new Types.ObjectId(outletId),
        createdAt: { $gte: start, $lte: end },
      },
    },
    { $unwind: '$items' },
    { $group: { _id: '$items.status', count: { $sum: 1 } } },
  ]);

  const raw = rows.reduce((acc, r) => {
    acc[r._id] = r.count;
    return acc;
  }, {} as Record<string, number>);

  const completed = raw.served || 0;
  const preparing = (raw.in_queue || 0) + (raw.preparing || 0);
  const ready = raw.ready || 0;
  const cancelled = raw.cancelled || 0;

  return {
    range: { from: start, to: end },
    completed,
    preparing,
    ready,
    cancelled,
    total: completed + preparing + ready + cancelled,
  };
};

// ── 4. TOP SELLING ITEMS ─────────────────────────────────────────────────────
/** WIDGET: Top N items by quantity sold in the selected period (default 5, max 50). */
export const getTopSellingItems = async (
  organizationId: string,
  outletId: string,
  filters: DashboardFilters = {}
) => {
  const { start, end } = resolvePeriod(filters);
  const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 50) : 5;

  const items = await OrderModel.aggregate([
    { $match: paidOrdersMatch(organizationId, outletId, start, end) },
    { $unwind: '$items' },
    { $match: { 'items.status': { $ne: 'cancelled' } } },
    {
      $group: {
        _id: '$items.menuItemId',
        name: { $first: '$items.name' },
        qty: { $sum: '$items.quantity' },
        amount: { $sum: '$items.itemTotal' },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: limit },
  ]);

  return { range: { from: start, to: end }, items };
};

// ── 5. PAYMENT SUMMARY ───────────────────────────────────────────────────────
/** WIDGET: Collection by payment mode + total collected in the selected period. */
export const getPaymentSummary = async (
  organizationId: string,
  outletId: string,
  filters: DashboardFilters = {}
) => {
  const { start, end } = resolvePeriod(filters);

  const rows = await OrderModel.aggregate([
    { $match: paidOrdersMatch(organizationId, outletId, start, end) },
    { $group: { _id: '$paymentMethod', amount: { $sum: '$grandTotal' } } },
    { $sort: { amount: -1 } },
  ]);

  const totalCollected = rows.reduce((sum, r) => sum + r.amount, 0);

  return {
    range: { from: start, to: end },
    totalCollected,
    byMode: rows.map((r) => ({
      mode: r._id,
      amount: r.amount,
      sharePercent: totalCollected ? Math.round((r.amount / totalCollected) * 1000) / 10 : 0,
    })),
  };
};

// ── 6. QUICK STATS (live snapshot — not period based) ────────────────────────
/**
 * WIDGET: Tables, Kitchen queue, Low stock, Day closing.
 * These describe the outlet *right now*, so they ignore the date scope:
 * - tables: current occupancy
 * - kitchen queue: every item still waiting/preparing on an active order
 * - low stock: inventory at or below its minimum level
 * - day closing: today's closing record (IST)
 */
export const getQuickStats = async (organizationId: string, outletId: string) => {
  const orgId = new Types.ObjectId(organizationId);
  const outId = new Types.ObjectId(outletId);
  const lowStockFilter = {
    organizationId: orgId,
    isActive: true,
    $expr: { $lte: ['$inStock', '$minLevel'] },
  };

  const [tablesTotal, tablesOccupied, kitchenQueueAgg, lowStockCount, lowStockPreview, closing] =
    await Promise.all([
      RestaurantTableModel.countDocuments({ organizationId: orgId, outletId: outId, isActive: true }),
      RestaurantTableModel.countDocuments({
        organizationId: orgId,
        outletId: outId,
        isActive: true,
        status: 'occupied',
      }),
      OrderModel.aggregate([
        { $match: { organizationId: orgId, outletId: outId, orderStatus: 'active' } },
        { $unwind: '$items' },
        { $match: { 'items.status': { $in: ['in_queue', 'preparing'] } } },
        { $count: 'count' },
      ]),
      InventoryModel.countDocuments(lowStockFilter),
      InventoryModel.find(lowStockFilter).select('material').limit(2),
      DayClosingModel.findOne({ organizationId: orgId, outletId: outId, closingDate: todayIST() }),
    ]);

  return {
    tablesOccupied,
    tablesTotal,
    kitchenQueueCount: kitchenQueueAgg[0]?.count || 0,
    lowStockCount,
    lowStockPreview: lowStockPreview.map((i) => i.material),
    dayClosingStatus: closing ? 'Submitted' : 'Pending',
    dayClosingDifference: closing ? closing.difference : null,
  };
};


// ── SALES BY ORDER TYPE ──────────────────────────────────────────────────────
/** WIDGET: Revenue split by order type (dine_in / takeaway / delivery / online) for the selected period. */
export const getSalesByOrderType = async (
  organizationId: string,
  outletId: string,
  filters: DashboardFilters = {}
) => {
  const { start, end } = resolvePeriod(filters);

  const rows = await OrderModel.aggregate([
    { $match: paidOrdersMatch(organizationId, outletId, start, end) },
    {
      $group: {
        _id: '$orderType',
        amount: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { amount: -1 } },
  ]);

  const totalSales = rows.reduce((sum, r) => sum + r.amount, 0);

  return {
    range: { from: start, to: end },
    totalSales,
    byOrderType: rows.map((r) => ({
      orderType: r._id,
      amount: r.amount,
      orders: r.orders,
      sharePercent: totalSales ? Math.round((r.amount / totalSales) * 1000) / 10 : 0,
    })),
  };
};

// ── ORCHESTRATOR ─────────────────────────────────────────────────────────────
/** Everything the dashboard needs in one payload. Widgets stay independently callable. */
export const getDashboardSummary = async (
  organizationId: string,
  outletId: string,
  filters: DashboardFilters = {}
) => {
  const { start, end } = resolvePeriod(filters);

  const [salesKpis, salesTrend, kitchenTicketStatus, topSellingItems, paymentSummary,salesByOrderType, quickStats] =
    await Promise.all([
      getSalesKpis(organizationId, outletId, filters),
      getSalesTrend(organizationId, outletId, filters),
      getKitchenTicketStatus(organizationId, outletId, filters),
      getTopSellingItems(organizationId, outletId, { ...filters, limit: 5 }),
      getPaymentSummary(organizationId, outletId, filters),
          getSalesByOrderType(organizationId, outletId, filters),
      getQuickStats(organizationId, outletId),
    ]);

  return {
    range: { from: start, to: end },
    salesKpis,
    salesTrend,
    kitchenTicketStatus,
    topSellingItems,
    paymentSummary,
      salesByOrderType,
    quickStats,
  };
};