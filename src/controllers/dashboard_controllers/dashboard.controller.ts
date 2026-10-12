// import { Response, NextFunction } from 'express';
// import { RoleBasedRequest } from '../../utils/utils.js';
// import * as dashboardService from './dashboard.service.js';

// /**
//  * ALL IN ONE CONTROLLER
//  * Serves the entire Dashboard screen in one call: KPI row, sales-by-hour
//  * chart, kitchen ticket donut, top-selling items, payment summary, and the
//  * 4 quick-stat cards (Tables/Kitchen queue/Low stock/Day closing).
//  * Query: date (YYYY-MM-DD, optional — defaults to today).
//  */
// export const getDashboardSummary = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
//   try {
//     const { organizationId, outletId } = req.params;
//     const { date } = req.query;

//     if (!organizationId) {
//       return res.status(400).json({ ok: false, message: 'organizationId is required' });
//     }
//     if (!outletId) {
//       return res.status(400).json({ ok: false, message: 'outletId is required' });
//     }

//     const summary = await dashboardService.getDashboardSummary(
//       organizationId,
//       outletId,
//       date as string
//     );

//     return res.status(200).json({ ok: true, data: summary });
//   } catch (error) {
//     next(error);
//   }
// };


// //  THIS IS SEPERATE CONTORLERS FOR SEPERATE SERVICES

// function getParams(req: RoleBasedRequest, res: Response) {
//   const { organizationId, outletId } = req.params;
//   if (!organizationId) {
//     res.status(400).json({ ok: false, message: 'organizationId is required' });
//     return null;
//   }
//   if (!outletId) {
//     res.status(400).json({ ok: false, message: 'outletId is required' });
//     return null;
//   }
//   return { organizationId, outletId };
// }

// /**
//  * WIDGET: Top KPI row — "Total sales", "Orders", "Average bill", "Expenses today"
//  * with % change vs yesterday.
//  */
// export const getSalesKpis = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
//   try {
//     const ids = getParams(req, res);
//     if (!ids) return;

//     const data = await dashboardService.getSalesKpis(
//       ids.organizationId,
//       ids.outletId,
//       req.query.date as string
//     );
//     return res.status(200).json({ ok: true, data });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * WIDGET: "Sales by hour" spark chart — 24-value array for the selected day.
//  */
// export const getSalesByHour = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
//   try {
//     const ids = getParams(req, res);
//     if (!ids) return;

//     const data = await dashboardService.getSalesByHour(
//       ids.organizationId,
//       ids.outletId,
//       req.query.date as string
//     );
//     return res.status(200).json({ ok: true, data });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * WIDGET: "Kitchen ticket status" donut — completed/preparing/ready/cancelled counts.
//  */
// export const getKitchenTicketStatus = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
//   try {
//     const ids = getParams(req, res);
//     if (!ids) return;

//     const data = await dashboardService.getKitchenTicketStatus(
//       ids.organizationId,
//       ids.outletId,
//       req.query.date as string
//     );
//     return res.status(200).json({ ok: true, data });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * WIDGET: "Top selling items" table — top N items by quantity sold (default 5).
//  */
// export const getTopSellingItems = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
//   try {
//     const ids = getParams(req, res);
//     if (!ids) return;

//     const { date, limit } = req.query;
//     const data = await dashboardService.getTopSellingItems(
//       ids.organizationId,
//       ids.outletId,
//       date as string,
//       limit ? Number(limit) : undefined
//     );
//     return res.status(200).json({ ok: true, data });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * WIDGET: "Payment summary" — collection by payment mode + total collected.
//  */
// export const getPaymentSummary = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
//   try {
//     const ids = getParams(req, res);
//     if (!ids) return;

//     const data = await dashboardService.getPaymentSummary(
//       ids.organizationId,
//       ids.outletId,
//       req.query.date as string
//     );
//     return res.status(200).json({ ok: true, data });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * WIDGET: The 4 quick-stat cards — Tables, Kitchen queue, Low stock, Day closing.
//  */
// export const getQuickStats = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
//   try {
//     const ids = getParams(req, res);
//     if (!ids) return;

//     const data = await dashboardService.getQuickStats(
//       ids.organizationId,
//       ids.outletId,
//       req.query.date as string
//     );
//     return res.status(200).json({ ok: true, data });
//   } catch (error) {
//     next(error);
//   }
// };




import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as dashboardService from './dashboard.service.js';
import type { DashboardFilters } from './dashboard.service.js';

const VALID_SCOPES = ['today', 'week', 'month', 'year', 'custom'];

/**
 * Validates the route params + query once for every handler.
 * Query: scope (today|week|month|year|custom, default today), from / to (YYYY-MM-DD, for custom), limit.
 * Sends the 400 itself and returns null when something is wrong.
 */
function getRequestContext(req: RoleBasedRequest, res: Response) {
  const { organizationId, outletId } = req.params;
  if (!organizationId) {
    res.status(400).json({ ok: false, message: 'organizationId is required' });
    return null;
  }
  if (!outletId) {
    res.status(400).json({ ok: false, message: 'outletId is required' });
    return null;
  }

  const { scope, from, to, limit } = req.query;
  if (scope && !VALID_SCOPES.includes(scope as string)) {
    res.status(400).json({ ok: false, message: `scope must be one of: ${VALID_SCOPES.join(', ')}` });
    return null;
  }
  if (scope === 'custom' && (!from || !to)) {
    res.status(400).json({ ok: false, message: 'from and to are required when scope is custom' });
    return null;
  }

  const filters: DashboardFilters = {
    scope: scope as DashboardFilters['scope'],
    from: from as string | undefined,
    to: to as string | undefined,
    limit: limit ? Number(limit) : undefined,
  };

  return { organizationId, outletId, filters };
}

/**
 * ALL IN ONE — the whole dashboard in a single call.
 * GET /:organizationId/:outletId/summary?scope=month
 */
export const getDashboardSummary = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ctx = getRequestContext(req, res);
    if (!ctx) return;

    const data = await dashboardService.getDashboardSummary(ctx.organizationId, ctx.outletId, ctx.filters);
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

/** WIDGET: Total sales / Orders / Average bill / Expenses, with change vs previous period. */
export const getSalesKpis = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ctx = getRequestContext(req, res);
    if (!ctx) return;

    const data = await dashboardService.getSalesKpis(ctx.organizationId, ctx.outletId, ctx.filters);
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

/** WIDGET: Sales trend — per hour (single day), per day (up to ~3 months) or per month. */
export const getSalesTrend = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ctx = getRequestContext(req, res);
    if (!ctx) return;

    const data = await dashboardService.getSalesTrend(ctx.organizationId, ctx.outletId, ctx.filters);
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

/** WIDGET: Kitchen ticket status donut for the selected period. */
export const getKitchenTicketStatus = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ctx = getRequestContext(req, res);
    if (!ctx) return;

    const data = await dashboardService.getKitchenTicketStatus(ctx.organizationId, ctx.outletId, ctx.filters);
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

/** WIDGET: Top selling items for the selected period (limit default 5). */
export const getTopSellingItems = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ctx = getRequestContext(req, res);
    if (!ctx) return;

    const data = await dashboardService.getTopSellingItems(ctx.organizationId, ctx.outletId, ctx.filters);
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

/** WIDGET: Collection by payment mode for the selected period. */
export const getPaymentSummary = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ctx = getRequestContext(req, res);
    if (!ctx) return;

    const data = await dashboardService.getPaymentSummary(ctx.organizationId, ctx.outletId, ctx.filters);
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};


/** WIDGET: Revenue split by order type for the selected period. */
export const getSalesByOrderType = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ctx = getRequestContext(req, res);
    if (!ctx) return;

    const data = await dashboardService.getSalesByOrderType(ctx.organizationId, ctx.outletId, ctx.filters);
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};


/** WIDGET: Tables / Kitchen queue / Low stock / Day closing — live snapshot, no date filter. */
export const getQuickStats = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ctx = getRequestContext(req, res);
    if (!ctx) return;

    const data = await dashboardService.getQuickStats(ctx.organizationId, ctx.outletId);
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};