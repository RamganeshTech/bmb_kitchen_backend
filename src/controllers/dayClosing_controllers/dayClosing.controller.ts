import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as dayClosingService from './dayClosing.service.js';

export const getDaySummary = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, outletId } = req.params;
    const { date } = req.query;

    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!outletId) {
      return res.status(400).json({ ok: false, message: 'outletId is required' });
    }
    if (!date) {
      return res.status(400).json({ ok: false, message: 'date query param (YYYY-MM-DD) is required' });
    }

    const summary = await dayClosingService.getDaySnapshot(organizationId, outletId, date as string);
    return res.status(200).json({ ok: true, data: summary });
  } catch (error) {
    next(error);
  }
};

export const createDayClosing = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { outletId, closingDate, actualCash, note } = req.body;
    if (!outletId || !closingDate || actualCash === undefined) {
      return res
        .status(400)
        .json({ ok: false, message: 'outletId, closingDate and actualCash are required' });
    }

    const closing = await dayClosingService.createDayClosing(organizationId, userId, {
      outletId,
      closingDate,
      actualCash,
      note,
    });

    return res.status(201).json({ ok: true, data: closing });
  } catch (error) {
    next(error);
  }
};

export const getClosingByDate = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, outletId, date } = req.params;

    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!outletId || !date) {
      return res.status(400).json({ ok: false, message: 'outletId and date are required' });
    }

    const closing = await dayClosingService.getClosingByDate(organizationId, outletId, date);
    return res.status(200).json({ ok: true, data: closing });
  } catch (error) {
    next(error);
  }
};

export const listClosingHistory = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, outletId } = req.params;
    const { limit } = req.query;

    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!outletId) {
      return res.status(400).json({ ok: false, message: 'outletId is required' });
    }

    const history = await dayClosingService.listClosingHistory(
      organizationId,
      outletId,
      limit ? Number(limit) : undefined
    );

    return res.status(200).json({ ok: true, data: history });
  } catch (error) {
    next(error);
  }
};

export const reopenDayClosing = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;
    const { reason } = req.body;

    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const closing = await dayClosingService.reopenDayClosing(organizationId, userId, id, reason);
    return res.status(200).json({ ok: true, data: closing });
  } catch (error) {
    next(error);
  }
};