import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as dashboardService from './dashboard.service.js';

/**
 * ALL IN ONE CONTROLLER
 * Serves the entire Dashboard screen in one call: KPI row, sales-by-hour
 * chart, kitchen ticket donut, top-selling items, payment summary, and the
 * 4 quick-stat cards (Tables/Kitchen queue/Low stock/Day closing).
 * Query: date (YYYY-MM-DD, optional — defaults to today).
 */
export const getDashboardSummary = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, outletId } = req.params;
    const { date } = req.query;

    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!outletId) {
      return res.status(400).json({ ok: false, message: 'outletId is required' });
    }

    const summary = await dashboardService.getDashboardSummary(
      organizationId,
      outletId,
      date as string
    );

    return res.status(200).json({ ok: true, data: summary });
  } catch (error) {
    next(error);
  }
};


//  THIS IS SEPERATE CONTORLERS FOR SEPERATE SERVICES

function getParams(req: RoleBasedRequest, res: Response) {
  const { organizationId, outletId } = req.params;
  if (!organizationId) {
    res.status(400).json({ ok: false, message: 'organizationId is required' });
    return null;
  }
  if (!outletId) {
    res.status(400).json({ ok: false, message: 'outletId is required' });
    return null;
  }
  return { organizationId, outletId };
}

/**
 * WIDGET: Top KPI row — "Total sales", "Orders", "Average bill", "Expenses today"
 * with % change vs yesterday.
 */
export const getSalesKpis = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ids = getParams(req, res);
    if (!ids) return;

    const data = await dashboardService.getSalesKpis(
      ids.organizationId,
      ids.outletId,
      req.query.date as string
    );
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * WIDGET: "Sales by hour" spark chart — 24-value array for the selected day.
 */
export const getSalesByHour = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ids = getParams(req, res);
    if (!ids) return;

    const data = await dashboardService.getSalesByHour(
      ids.organizationId,
      ids.outletId,
      req.query.date as string
    );
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * WIDGET: "Kitchen ticket status" donut — completed/preparing/ready/cancelled counts.
 */
export const getKitchenTicketStatus = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ids = getParams(req, res);
    if (!ids) return;

    const data = await dashboardService.getKitchenTicketStatus(
      ids.organizationId,
      ids.outletId,
      req.query.date as string
    );
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * WIDGET: "Top selling items" table — top N items by quantity sold (default 5).
 */
export const getTopSellingItems = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ids = getParams(req, res);
    if (!ids) return;

    const { date, limit } = req.query;
    const data = await dashboardService.getTopSellingItems(
      ids.organizationId,
      ids.outletId,
      date as string,
      limit ? Number(limit) : undefined
    );
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * WIDGET: "Payment summary" — collection by payment mode + total collected.
 */
export const getPaymentSummary = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ids = getParams(req, res);
    if (!ids) return;

    const data = await dashboardService.getPaymentSummary(
      ids.organizationId,
      ids.outletId,
      req.query.date as string
    );
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * WIDGET: The 4 quick-stat cards — Tables, Kitchen queue, Low stock, Day closing.
 */
export const getQuickStats = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const ids = getParams(req, res);
    if (!ids) return;

    const data = await dashboardService.getQuickStats(
      ids.organizationId,
      ids.outletId,
      req.query.date as string
    );
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};