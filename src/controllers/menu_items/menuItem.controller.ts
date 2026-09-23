import type { Response, NextFunction } from 'express';
import * as menuItemService from './menuItem.services.js';
import type { RoleBasedRequest } from '../../utils/utils.js';

export const createMenuItem = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { name, categoryId, basePrice, foodType, prepTime, variants, addOns } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!name || !categoryId || basePrice === undefined) {
      res.status(400).json({ ok: false, message: 'Name, Category ID, and Base Price are required' });
      return;
    }

    const item = await menuItemService.createMenuItem(organizationId, userId, {
      name,
      categoryId,
      basePrice,
      foodType,
      prepTime,
      variants,
      addOns,
    });

    res.status(201).json({ ok: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const getActiveMenuItems = async (
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

    const items = await menuItemService.getAllActiveMenuItems(organizationId);
    
    res.status(200).json({ ok: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const getInactiveMenuItems = async (
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

    const items = await menuItemService.getAllInactiveMenuItems(organizationId);
    
    res.status(200).json({ ok: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const getMenuItemById = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params as { organizationId: string; id: string };

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const item = await menuItemService.getMenuItemById(organizationId, id);
    
    res.status(200).json({ ok: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const getMenuItemDropdown = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, categoryId } = req.params;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!categoryId) {
      res.status(400).json({ ok: false, message: 'Category ID is required' });
      return;
    }

    const dropdownList = await menuItemService.getMenuItemDropdown(organizationId, categoryId);

    res.status(200).json({ ok: true, data: dropdownList });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params as { organizationId: string; id: string };
    const { name, categoryId, basePrice, foodType, prepTime, variants, addOns } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const updatedItem = await menuItemService.updateMenuItem(
      organizationId,
      id,
      userId,
      { name, categoryId, basePrice, foodType, prepTime, variants, addOns }
    );

    res.status(200).json({ ok: true, data: updatedItem });
  } catch (error) {
    next(error);
  }
};

export const softDeleteMenuItem = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params as { organizationId: string; id: string };
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    await menuItemService.softDeleteMenuItem(organizationId, id, userId);
    
    res.status(200).json({ ok: true, message: 'Menu item deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

export const recoverMenuItem = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params as { organizationId: string; id: string };
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    await menuItemService.recoverMenuItem(organizationId, id, userId);
    
    res.status(200).json({ ok: true, message: 'Menu item recovered successfully' });
  } catch (error) {
    next(error);
  }
};

export const hardDeleteMenuItem = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params as { organizationId: string; id: string };

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    await menuItemService.hardDeleteMenuItem(organizationId, id);
    
    res.status(200).json({ ok: true, message: 'Menu item permanently deleted' });
  } catch (error) {
    next(error);
  }
};