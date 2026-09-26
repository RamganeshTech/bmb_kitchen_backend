import { Types } from 'mongoose';
import OrderModel from '../../models/order_models/order.model.js';
import ExpenseModel from '../../models/expense_model/expense.model.js';
import RestaurantTableModel from '../../models/restaurant_table_model/restaurantTable.model.js';
import DayClosingModel from '../../models/dayClosing_model/dayClosing.model.js';
import { InventoryModel } from '../../models/inventory_model/Inventory.model.js';

/**
 * Resolves the start/end Date boundaries for a single calendar day.
 * Every dashboard widget is scoped to one day (defaults to today, matching
 * the HTML's dashboard which is always "today" — no historic scrolling).
 */
function resolveDayRange(dateStr?: string) {
  const day = dateStr || new Date().toISOString().slice(0, 10);
  const start = new Date(`${day}T00:00:00.000`);
  const end = new Date(`${day}T23:59:59.999`);
  return { day, start, end };
}

function previousDay(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00.000`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function percentDelta(current: number, previous: number) {
  if (!previous) return null; // matches the HTML: no "vs yesterday" badge shown when yesterday was 0
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * WIDGET: Top KPI row — "Total sales", "Orders", "Average bill", "Expenses today"
 * Pulls today's completed+paid orders and today's expenses, each compared
 * against yesterday's same figures for the up/down % badge.
 */
export const getSalesKpis = async (organizationId: string, outletId: string, date?: string) => {
  const { day, start, end } = resolveDayRange(date);
  const yDay = previousDay(day);
  const { start: yStart, end: yEnd } = resolveDayRange(yDay);

  const orgId = new Types.ObjectId(organizationId);
  const outId = new Types.ObjectId(outletId);

  const buildMatch = (s: Date, e: Date) => ({
    organizationId: orgId,
    outletId: outId,
    orderStatus: 'completed',
    paymentStatus: 'paid',
    paidAt: { $gte: s, $lte: e },
  });

  const [todayAgg, yesterdayAgg, todayExpenseAgg] = await Promise.all([
    OrderModel.aggregate([
      { $match: buildMatch(start, end) },
      { $group: { _id: null, sales: { $sum: '$grandTotal' }, orders: { $sum: 1 } } },
    ]),
    OrderModel.aggregate([
      { $match: buildMatch(yStart, yEnd) },
      { $group: { _id: null, sales: { $sum: '$grandTotal' }, orders: { $sum: 1 } } },
    ]),
    ExpenseModel.aggregate([
      { $match: { organizationId: orgId, outletId: outId, isActive: true, date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const today = todayAgg[0] || { sales: 0, orders: 0 };
  const yesterday = yesterdayAgg[0] || { sales: 0, orders: 0 };
  const expensesToday = todayExpenseAgg[0]?.total || 0;

  const avgBill = today.orders ? today.sales / today.orders : 0;
  const yAvgBill = yesterday.orders ? yesterday.sales / yesterday.orders : 0;

  return {
    totalSales: today.sales,
    orders: today.orders,
    avgBillValue: avgBill,
    expensesToday,
    deltaVsYesterday: {
      salesPercent: percentDelta(today.sales, yesterday.sales),
      ordersPercent: percentDelta(today.orders, yesterday.orders),
      avgBillPercent: percentDelta(avgBill, yAvgBill),
    },
  };
};

/**
 * WIDGET: "Sales by hour" spark chart
 * Returns a 24-length array (index 0 = 12 AM ... 23 = 11 PM), each value
 * being total grandTotal collected in that hour of the selected day.
 */
export const getSalesByHour = async (organizationId: string, outletId: string, date?: string) => {
  const { start, end } = resolveDayRange(date);

  const rows = await OrderModel.aggregate([
    {
      $match: {
        organizationId: new Types.ObjectId(organizationId),
        outletId: new Types.ObjectId(outletId),
        orderStatus: 'completed',
        paymentStatus: 'paid',
        paidAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { $hour: '$paidAt' },
        sales: { $sum: '$grandTotal' },
      },
    },
  ]);

  const hours = new Array(24).fill(0);
  rows.forEach((r) => {
    hours[r._id] = r.sales;
  });

  return hours;
};

/**
 * WIDGET: "Kitchen ticket status" donut
 * The HTML tracks separate KOT tickets with statuses new/accepted/preparing/
 * ready/completed/cancelled. This backend has no separate KOT collection —
 * status lives per order-item (in_queue/preparing/ready/served/cancelled) —
 * so we bucket item statuses into the same 4 groups the donut shows:
 * in_queue + preparing → "preparing", ready → "ready", served → "completed".
 */
export const getKitchenTicketStatus = async (
  organizationId: string,
  outletId: string,
  date?: string
) => {
  const { start, end } = resolveDayRange(date);

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

  return { completed, preparing, ready, cancelled, total: completed + preparing + ready + cancelled };
};

/**
 * WIDGET: "Top selling items" table
 * Ranks menu items by quantity sold today, defaulting to the top 5 shown
 * in the HTML — limit is adjustable via query param.
 */
export const getTopSellingItems = async (
  organizationId: string,
  outletId: string,
  date?: string,
  limit = 5
) => {
  const { start, end } = resolveDayRange(date);

  return OrderModel.aggregate([
    {
      $match: {
        organizationId: new Types.ObjectId(organizationId),
        outletId: new Types.ObjectId(outletId),
        orderStatus: 'completed',
        paymentStatus: 'paid',
        paidAt: { $gte: start, $lte: end },
      },
    },
    { $unwind: '$items' },
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
};

/**
 * WIDGET: "Payment summary" — collection by mode + total collected today
 */
export const getPaymentSummary = async (organizationId: string, outletId: string, date?: string) => {
  const { start, end } = resolveDayRange(date);

  const rows = await OrderModel.aggregate([
    {
      $match: {
        organizationId: new Types.ObjectId(organizationId),
        outletId: new Types.ObjectId(outletId),
        orderStatus: 'completed',
        paymentStatus: 'paid',
        paidAt: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: '$paymentMethod', amount: { $sum: '$grandTotal' } } },
  ]);

  const totalCollected = rows.reduce((sum, r) => sum + r.amount, 0);

  return {
    byMode: rows.map((r) => ({
      mode: r._id,
      amount: r.amount,
      sharePercent: totalCollected ? Math.round((r.amount / totalCollected) * 1000) / 10 : 0,
    })),
    totalCollected,
  };
};

/**
 * WIDGET: The 4 clickable quick-stat cards — Tables, Kitchen queue,
 * Low stock, Day closing.
 */
export const getQuickStats = async (organizationId: string, outletId: string, date?: string) => {
  const { day, start, end } = resolveDayRange(date);

  const orgId = new Types.ObjectId(organizationId);
  const outId = new Types.ObjectId(outletId);

  const [tablesTotal, tablesOccupied, kitchenQueueAgg, lowStockItems, closing] = await Promise.all([
    RestaurantTableModel.countDocuments({ organizationId: orgId, outletId: outId, isActive: true }),
    RestaurantTableModel.countDocuments({
      organizationId: orgId,
      outletId: outId,
      status: 'occupied',
    }),
    OrderModel.aggregate([
      {
        $match: {
          organizationId: orgId,
          outletId: outId,
          createdAt: { $gte: start, $lte: end },
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.status': { $in: ['in_queue', 'preparing'] } } },
      { $count: 'count' },
    ]),
    // low stock = current inStock at or below the configured minLevel
    InventoryModel.find({
      organizationId: orgId,
      $expr: { $lte: ['$inStock', '$minLevel'] },
    })
      .select('material')
      .limit(5),
    DayClosingModel.findOne({ organizationId: orgId, outletId: outId, closingDate: day }),
  ]);

  return {
    tablesOccupied,
    tablesTotal,
    kitchenQueueCount: kitchenQueueAgg[0]?.count || 0,
    lowStockCount: lowStockItems.length,
    lowStockPreview: lowStockItems.slice(0, 2).map((i) => i.material),
    dayClosingStatus: closing ? 'Submitted' : 'Pending',
    dayClosingDifference: closing ? closing.difference : null,
  };
};

/**
 * ORCHESTRATOR — composes every widget above into the single payload the
 * Dashboard screen needs on load, matching VIEWS.dashboard in the HTML
 * exactly (one screen, one data fetch). Individual widget functions above
 * remain independently exported/reusable if the frontend later wants to
 * lazy-load or refresh sections separately.
 */
export const getDashboardSummary = async (organizationId: string, outletId: string, date?: string) => {
  const [salesKpis, salesByHour, kitchenTicketStatus, topSellingItems, paymentSummary, quickStats] =
    await Promise.all([
      getSalesKpis(organizationId, outletId, date),
      getSalesByHour(organizationId, outletId, date),
      getKitchenTicketStatus(organizationId, outletId, date),
      getTopSellingItems(organizationId, outletId, date, 5),
      getPaymentSummary(organizationId, outletId, date),
      getQuickStats(organizationId, outletId, date),
    ]);

  return {
    date: date || new Date().toISOString().slice(0, 10),
    salesKpis,
    salesByHour,
    kitchenTicketStatus,
    topSellingItems,
    paymentSummary,
    quickStats,
  };
};  