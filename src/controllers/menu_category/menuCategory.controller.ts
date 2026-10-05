import type { Response, NextFunction } from 'express';
import * as menuCategoryService from './menuCategory.services.js';
import type { RoleBasedRequest } from '../../utils/utils.js';

export const createMenuCategory = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params as { organizationId: string };
    const { name, description } = req.body;
    const userId = req.user!.userId;
    const file = req.file;


    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!name) {
      res.status(400).json({ ok: false, message: 'Category name is required' });
      return;
    }

    const category = await menuCategoryService.createMenuCategory(organizationId, userId, {
      name,
      description,
    }, file);

    res.status(201).json({ ok: true, data: category });
  } catch (error) {
    next(error);
  }
};



// ── UPDATE PICTURE ────────────────────────────────────────────────
export const updateMenuCategoryImage = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, categoryId } = req.params as { organizationId: string; categoryId: string };
    const userId = req.user!.userId;
    const file = req.file;

    if (!organizationId || !categoryId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Category ID are required' });
      return;
    }
    if (!file) {
      res.status(400).json({ ok: false, message: 'An image file is required' });
      return;
    }

    const category = await menuCategoryService.updateMenuCategoryImage(organizationId, categoryId, userId, file);
    res.status(200).json({ ok: true, message: 'Image updated', data: category });
  } catch (error) {
    next(error);
  }
};

// ── REMOVE PICTURE ────────────────────────────────────────────────
export const removeMenuCategoryImage = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, categoryId } = req.params as { organizationId: string; categoryId: string };
    const userId = req.user!.userId;

    if (!organizationId || !categoryId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Category ID are required' });
      return;
    }

    const category = await menuCategoryService.removeMenuCategoryImage(organizationId, categoryId, userId);
    res.status(200).json({ ok: true, message: 'Image removed', data: category });
  } catch (error) {
    next(error);
  }
};

export const getActiveMenuCategories = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params as { organizationId: string };

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const categories = await menuCategoryService.getAllActiveMenuCategories(organizationId);

    res.status(200).json({ ok: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getInactiveMenuCategories = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params as { organizationId: string };

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const categories = await menuCategoryService.getAllInactiveMenuCategories(organizationId);

    res.status(200).json({ ok: true, data: categories });
  } catch (error) {
    next(error);
  }
};


export const getMenuCategoryDropdown = async (
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

    const dropdownList = await menuCategoryService.getMenuCategoryDropdown(organizationId);

    res.status(200).json({ ok: true, data: dropdownList });
  } catch (error) {
    next(error);
  }
};


export const getMenuCategoryById = async (
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

    const category = await menuCategoryService.getMenuCategoryById(organizationId, id);

    res.status(200).json({ ok: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateMenuCategory = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params as { organizationId: string; id: string };
    const { name, description } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const updatedCategory = await menuCategoryService.updateMenuCategory(
      organizationId,
      id,
      userId,
      { name, description }
    );

    res.status(200).json({ ok: true, data: updatedCategory });
  } catch (error) {
    next(error);
  }
};

export const softDeleteMenuCategory = async (
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

    await menuCategoryService.softDeleteMenuCategory(organizationId, id, userId);

    res.status(200).json({ ok: true, message: 'Menu category deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

export const recoverMenuCategory = async (
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

    await menuCategoryService.recoverMenuCategory(organizationId, id, userId);

    res.status(200).json({ ok: true, message: 'Menu category recovered successfully' });
  } catch (error) {
    next(error);
  }
};

export const hardDeleteMenuCategory = async (
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

    await menuCategoryService.hardDeleteMenuCategory(organizationId, id);

    res.status(200).json({ ok: true, message: 'Menu category permanently deleted' });
  } catch (error) {
    next(error);
  }
};