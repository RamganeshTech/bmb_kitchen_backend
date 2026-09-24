import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as outletService from './outlet.service.js';

// ── CREATE ────────────────────────────────────────────────────────
export const createOutlet = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { name, code, address, phone } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!name) {
      res.status(400).json({ ok: false, message: 'Outlet name is required' });
      return;
    }

    const outlet = await outletService.createOutlet(organizationId, userId, {
      name,
      code,
      address,
      phone,
    });

    res.status(201).json({ ok: true, data: outlet });
  } catch (error) {
    next(error);
  }
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getOutletList = async (
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

    const outlets = await outletService.getOutletList(organizationId);

    res.status(200).json({ ok: true, data: outlets });
  } catch (error) {
    next(error);
  }
};

// ── LIST (inactive / soft-deleted) ────────────────────────────────
export const getInactiveOutletList = async (
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

    const outlets = await outletService.getInactiveOutletList(organizationId);

    res.status(200).json({ ok: true, data: outlets });
  } catch (error) {
    next(error);
  }
};

// ── DROPDOWN (name, code, _id only) ───────────────────────────────
export const getOutletDropdown = async (
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

    const outlets = await outletService.getOutletDropdown(organizationId);

    res.status(200).json({ ok: true, data: outlets });
  } catch (error) {
    next(error);
  }
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getOutletById = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, outletId } = req.params;

    if (!organizationId || !outletId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Outlet ID are required' });
      return;
    }

    const outlet = await outletService.getOutletById(organizationId, outletId);

    res.status(200).json({ ok: true, data: outlet });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateOutlet = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, outletId } = req.params;
    const userId = req.user!.userId;
    const { name, code, address, phone } = req.body;

    if (!organizationId || !outletId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Outlet ID are required' });
      return;
    }

    const outlet = await outletService.updateOutlet(organizationId, outletId, userId, {
      name,
      code,
      address,
      phone,
    });

    res.status(200).json({ ok: true, data: outlet });
  } catch (error) {
    next(error);
  }
};

// ── SOFT DELETE ───────────────────────────────────────────────────
export const softDeleteOutlet = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, outletId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !outletId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Outlet ID are required' });
      return;
    }

    const outlet = await outletService.softDeleteOutlet(organizationId, outletId, userId);

    res.status(200).json({ ok: true, message: 'Outlet deactivated', data: outlet });
  } catch (error) {
    next(error);
  }
};

// ── RESTORE ────────────────────────────────────────────────────────
export const restoreOutlet = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, outletId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !outletId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Outlet ID are required' });
      return;
    }

    const outlet = await outletService.restoreOutlet(organizationId, outletId, userId);

    res.status(200).json({ ok: true, message: 'Outlet restored', data: outlet });
  } catch (error) {
    next(error);
  }
};

// ── HARD DELETE ───────────────────────────────────────────────────
export const hardDeleteOutlet = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, outletId } = req.params;

    if (!organizationId || !outletId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Outlet ID are required' });
      return;
    }

    await outletService.hardDeleteOutlet(organizationId, outletId);

    res.status(200).json({ ok: true, message: 'Outlet permanently deleted' });
  } catch (error) {
    next(error);
  }
};