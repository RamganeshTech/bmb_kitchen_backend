import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as wastageAdjustmentService from './wastageadjustment.service.js';

// ── CREATE ────────────────────────────────────────────────────────
export const createWastageAdjustment = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { inventoryId, type, quantity, reason } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!inventoryId || !type || quantity === undefined) {
      res
        .status(400)
        .json({ ok: false, message: 'Inventory ID, type, and quantity are required' });
      return;
    }

    if (type !== 'wastage' && type !== 'adjustment') {
      res.status(400).json({ ok: false, message: "Type must be 'wastage' or 'adjustment'" });
      return;
    }

    const entry = await wastageAdjustmentService.createWastageAdjustment(organizationId, userId, {
      inventoryId,
      type,
      quantity,
      reason,
    });

    res.status(201).json({ ok: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getWastageAdjustmentList = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const entries = await wastageAdjustmentService.getWastageAdjustmentList(organizationId);

    res.status(200).json({ ok: true, data: entries });
  } catch (error) {
    next(error);
  }
};

// ── LIST (inactive / soft-deleted) ────────────────────────────────
export const getInactiveWastageAdjustmentList = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const entries = await wastageAdjustmentService.getInactiveWastageAdjustmentList(
      organizationId
    );

    res.status(200).json({ ok: true, data: entries });
  } catch (error) {
    next(error);
  }
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getWastageAdjustmentById = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, wastageAdjustmentId } = req.params;

    if (!organizationId || !wastageAdjustmentId) {
      res
        .status(400)
        .json({ ok: false, message: 'Organization ID and Wastage/Adjustment ID are required' });
      return;
    }

    const entry = await wastageAdjustmentService.getWastageAdjustmentById(
      organizationId,
      wastageAdjustmentId
    );

    res.status(200).json({ ok: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateWastageAdjustment = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, wastageAdjustmentId } = req.params;
    const userId = req.user!.userId;
    const { type, reason } = req.body;

    if (!organizationId || !wastageAdjustmentId) {
      res
        .status(400)
        .json({ ok: false, message: 'Organization ID and Wastage/Adjustment ID are required' });
      return;
    }

    const entry = await wastageAdjustmentService.updateWastageAdjustment(
      organizationId,
      wastageAdjustmentId,
      userId,
      { type, reason }
    );

    res.status(200).json({ ok: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// ── SOFT DELETE ───────────────────────────────────────────────────
export const softDeleteWastageAdjustment = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, wastageAdjustmentId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !wastageAdjustmentId) {
      res
        .status(400)
        .json({ ok: false, message: 'Organization ID and Wastage/Adjustment ID are required' });
      return;
    }

    const entry = await wastageAdjustmentService.softDeleteWastageAdjustment(
      organizationId,
      wastageAdjustmentId,
      userId
    );

    res.status(200).json({ ok: true, message: 'Entry deactivated', data: entry });
  } catch (error) {
    next(error);
  }
};

// ── RESTORE ────────────────────────────────────────────────────────
export const restoreWastageAdjustment = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, wastageAdjustmentId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !wastageAdjustmentId) {
      res
        .status(400)
        .json({ ok: false, message: 'Organization ID and Wastage/Adjustment ID are required' });
      return;
    }

    const entry = await wastageAdjustmentService.restoreWastageAdjustment(
      organizationId,
      wastageAdjustmentId,
      userId
    );

    res.status(200).json({ ok: true, message: 'Entry restored', data: entry });
  } catch (error) {
    next(error);
  }
};

// ── HARD DELETE ───────────────────────────────────────────────────
export const hardDeleteWastageAdjustment = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, wastageAdjustmentId } = req.params;

    if (!organizationId || !wastageAdjustmentId) {
      res
        .status(400)
        .json({ ok: false, message: 'Organization ID and Wastage/Adjustment ID are required' });
      return;
    }

    await wastageAdjustmentService.hardDeleteWastageAdjustment(organizationId, wastageAdjustmentId);

    res.status(200).json({ ok: true, message: 'Entry permanently deleted' });
  } catch (error) {
    next(error);
  }
};