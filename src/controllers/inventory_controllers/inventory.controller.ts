import { Response, NextFunction } from 'express';
import * as inventoryService from './inventory.service.js';
import { RoleBasedRequest } from '../../utils/utils.js';

// ── CREATE ────────────────────────────────────────────────────────
export const createInventory = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { material, category, unit, inStock, minLevel, rate, vendorId } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!material || !category || !unit || rate === undefined) {
      res.status(400).json({ ok: false, message: 'Material, Category, Unit, and Rate are required' });
      return;
    }

    const item = await inventoryService.createInventory(organizationId, userId, {
      material,
      category,
      unit,
      inStock,
      minLevel,
      rate,
      vendorId,
    });

    res.status(201).json({ ok: true, data: item });
  } catch (error) {
    next(error);
  }
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getInventoryList = async (
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

    const items = await inventoryService.getInventoryList(organizationId);

    res.status(200).json({ ok: true, data: items });
  } catch (error) {
    next(error);
  }
};

// ── LIST (inactive / soft-deleted) ────────────────────────────────
export const getInactiveInventoryList = async (
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

    const items = await inventoryService.getInactiveInventoryList(organizationId);

    res.status(200).json({ ok: true, data: items });
  } catch (error) {
    next(error);
  }
};

// ── DROPDOWN (material, rate, _id only) ───────────────────────────
export const getInventoryDropdown = async (
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

    const items = await inventoryService.getInventoryDropdown(organizationId);

    res.status(200).json({ ok: true, data: items });
  } catch (error) {
    next(error);
  }
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getInventoryById = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, inventoryId } = req.params;

    if (!organizationId || !inventoryId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Inventory ID are required' });
      return;
    }

    const item = await inventoryService.getInventoryById(organizationId, inventoryId);

    res.status(200).json({ ok: true, data: item });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateInventory = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, inventoryId } = req.params;
    const userId = req.user!.userId;
    const { material, category, unit, inStock, minLevel, rate, vendorId } = req.body;

    if (!organizationId || !inventoryId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Inventory ID are required' });
      return;
    }

    const item = await inventoryService.updateInventory(organizationId, inventoryId, userId, {
      material,
      category,
      unit,
      inStock,
      minLevel,
      rate,
      vendorId,
    });

    res.status(200).json({ ok: true, data: item });
  } catch (error) {
    next(error);
  }
};

// ── SOFT DELETE ───────────────────────────────────────────────────
export const softDeleteInventory = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, inventoryId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !inventoryId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Inventory ID are required' });
      return;
    }

    const item = await inventoryService.softDeleteInventory(organizationId, inventoryId, userId);

    res.status(200).json({ ok: true, message: 'Inventory item deactivated', data: item });
  } catch (error) {
    next(error);
  }
};

// ── HARD DELETE ───────────────────────────────────────────────────
export const hardDeleteInventory = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, inventoryId } = req.params;

    if (!organizationId || !inventoryId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Inventory ID are required' });
      return;
    }

    await inventoryService.hardDeleteInventory(organizationId, inventoryId);

    res.status(200).json({ ok: true, message: 'Inventory item permanently deleted' });
  } catch (error) {
    next(error);
  }
};



// ── RESTORE (reactivate a soft-deleted item) ──────────────────────
export const restoreInventory = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, inventoryId } = req.params;
    const userId = req.user!.userId;
 
    if (!organizationId || !inventoryId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Inventory ID are required' });
      return;
    }
 
    const item = await inventoryService.restoreInventory(organizationId, inventoryId, userId);
 
    res.status(200).json({ ok: true, message: 'Inventory item restored', data: item });
  } catch (error) {
    next(error);
  }
};






// ── ADJUST STOCK (add or remove) ──────────────────────────────────
export const adjustInventoryStock = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, inventoryId } = req.params;
    const { action, quantity, reason } = req.body;
    const userId = req.user!.userId;
 
    if (!organizationId || !inventoryId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Inventory ID are required' });
      return;
    }
 
    if (action !== 'add' && action !== 'remove') {
      res.status(400).json({ ok: false, message: "Action must be 'add' or 'remove'" });
      return;
    }
 
    if (quantity === undefined || quantity <= 0) {
      res.status(400).json({ ok: false, message: 'Quantity must be a positive number' });
      return;
    }
 
    const item = await inventoryService.adjustInventoryStock(
      organizationId,
      userId,
      inventoryId,
      action,
      quantity,
      reason
    );
 
    res.status(200).json({
      ok: true,
      message: `Stock ${action === 'add' ? 'added' : 'removed'}`,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};
 