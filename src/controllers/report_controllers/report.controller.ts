import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as reportService from './report.service.js';

function extractFilters(req: RoleBasedRequest) {
  const { outletId, scope, from, to } = req.query;
  return {
    outletId: outletId as string,
    scope: scope as any,
    from: from as string,
    to: to as string,
  };
}

export const getSalesReport = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const data = await reportService.getSalesReport(organizationId, extractFilters(req));
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

export const getItemSalesReport = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const data = await reportService.getItemSalesReport(organizationId, extractFilters(req));
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

export const getExpenseReport = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { category } = req.query;
    const data = await reportService.getExpenseReport(organizationId, {
      ...extractFilters(req),
      category: category as string,
    });
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

export const getPaymentModeReport = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const data = await reportService.getPaymentModeReport(organizationId, extractFilters(req));
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

export const getGstSummary = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { page, limit } = req.query;
    const data = await reportService.getGstSummary(organizationId, {
      ...extractFilters(req),
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};