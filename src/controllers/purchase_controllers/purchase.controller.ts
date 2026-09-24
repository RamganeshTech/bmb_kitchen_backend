import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as purchaseService from './purchase.service.js';

// ── CREATE ────────────────────────────────────────────────────────
export const createPurchase = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { vendorId, items, paymentStatus } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!vendorId) {
      res.status(400).json({ ok: false, message: 'Vendor ID is required' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ ok: false, message: 'At least one purchase item is required' });
      return;
    }

    for (const item of items) {
      if (!item.inventoryId || item.quantity === undefined || item.rate === undefined) {
        res
          .status(400)
          .json({ ok: false, message: 'Each item requires inventoryId, quantity, and rate' });
        return;
      }
    }

    const purchase = await purchaseService.createPurchase(organizationId, userId, {
      vendorId,
      items,
      paymentStatus,
    });

    res.status(201).json({ ok: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getPurchaseList = async (
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

    const purchases = await purchaseService.getPurchaseList(organizationId);

    res.status(200).json({ ok: true, data: purchases });
  } catch (error) {
    next(error);
  }
};

// ── LIST (inactive / soft-deleted) ────────────────────────────────
export const getInactivePurchaseList = async (
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

    const purchases = await purchaseService.getInactivePurchaseList(organizationId);

    res.status(200).json({ ok: true, data: purchases });
  } catch (error) {
    next(error);
  }
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getPurchaseById = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, purchaseId } = req.params;

    if (!organizationId || !purchaseId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Purchase ID are required' });
      return;
    }

    const purchase = await purchaseService.getPurchaseById(organizationId, purchaseId);

    res.status(200).json({ ok: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updatePurchase = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, purchaseId } = req.params;
    const userId = req.user!.userId;
    const { paymentStatus } = req.body;

    if (!organizationId || !purchaseId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Purchase ID are required' });
      return;
    }

    const purchase = await purchaseService.updatePurchase(organizationId, purchaseId, userId, {
      paymentStatus,
    });

    res.status(200).json({ ok: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

// ── SOFT DELETE ───────────────────────────────────────────────────
export const softDeletePurchase = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, purchaseId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !purchaseId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Purchase ID are required' });
      return;
    }

    const purchase = await purchaseService.softDeletePurchase(organizationId, purchaseId, userId);

    res.status(200).json({ ok: true, message: 'Purchase deactivated', data: purchase });
  } catch (error) {
    next(error);
  }
};

// ── RESTORE ────────────────────────────────────────────────────────
export const restorePurchase = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, purchaseId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !purchaseId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Purchase ID are required' });
      return;
    }

    const purchase = await purchaseService.restorePurchase(organizationId, purchaseId, userId);

    res.status(200).json({ ok: true, message: 'Purchase restored', data: purchase });
  } catch (error) {
    next(error);
  }
};

// ── HARD DELETE ───────────────────────────────────────────────────
export const hardDeletePurchase = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, purchaseId } = req.params;

    if (!organizationId || !purchaseId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Purchase ID are required' });
      return;
    }

    await purchaseService.hardDeletePurchase(organizationId, purchaseId);

    res.status(200).json({ ok: true, message: 'Purchase permanently deleted' });
  } catch (error) {
    next(error);
  }
};