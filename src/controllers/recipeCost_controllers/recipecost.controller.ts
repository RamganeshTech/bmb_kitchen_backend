import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as recipeCostService from './recipeCost.service.js';

// ── CREATE ────────────────────────────────────────────────────────
export const createRecipeCost = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { menuItemId, ingredients, sellingPrice } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!menuItemId) {
      res.status(400).json({ ok: false, message: 'Menu Item ID is required' });
      return;
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      res.status(400).json({ ok: false, message: 'At least one ingredient is required' });
      return;
    }

    for (const ingredient of ingredients) {
      if (
        !ingredient.inventoryId ||
        !ingredient.unit ||
        ingredient.rate === undefined ||
        ingredient.unitValue === undefined
      ) {
        res.status(400).json({
          ok: false,
          message: 'Each ingredient requires inventoryId, unit, rate, and unitValue',
        });
        return;
      }
    }

    const recipe = await recipeCostService.createRecipeCost(organizationId, userId, {
      menuItemId,
      ingredients,
      sellingPrice,
    });

    res.status(201).json({ ok: true, data: recipe });
  } catch (error) {
    next(error);
  }
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getRecipeCostList = async (
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

    const recipes = await recipeCostService.getRecipeCostList(organizationId);

    res.status(200).json({ ok: true, data: recipes });
  } catch (error) {
    next(error);
  }
};

// ── LIST (inactive / soft-deleted) ────────────────────────────────
export const getInactiveRecipeCostList = async (
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

    const recipes = await recipeCostService.getInactiveRecipeCostList(organizationId);

    res.status(200).json({ ok: true, data: recipes });
  } catch (error) {
    next(error);
  }
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getRecipeCostById = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, recipeCostId } = req.params;

    if (!organizationId || !recipeCostId) {
      res
        .status(400)
        .json({ ok: false, message: 'Organization ID and Recipe Cost ID are required' });
      return;
    }

    const recipe = await recipeCostService.getRecipeCostById(organizationId, recipeCostId);

    res.status(200).json({ ok: true, data: recipe });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateRecipeCost = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, recipeCostId } = req.params;
    const userId = req.user!.userId;
    const { menuItemId, ingredients, sellingPrice } = req.body;

    if (!organizationId || !recipeCostId) {
      res
        .status(400)
        .json({ ok: false, message: 'Organization ID and Recipe Cost ID are required' });
      return;
    }

    const recipe = await recipeCostService.updateRecipeCost(organizationId, recipeCostId, userId, {
      menuItemId,
      ingredients,
      sellingPrice,
    });

    res.status(200).json({ ok: true, data: recipe });
  } catch (error) {
    next(error);
  }
};

// ── SOFT DELETE ───────────────────────────────────────────────────
export const softDeleteRecipeCost = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, recipeCostId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !recipeCostId) {
      res
        .status(400)
        .json({ ok: false, message: 'Organization ID and Recipe Cost ID are required' });
      return;
    }

    const recipe = await recipeCostService.softDeleteRecipeCost(
      organizationId,
      recipeCostId,
      userId
    );

    res.status(200).json({ ok: true, message: 'Recipe cost deactivated', data: recipe });
  } catch (error) {
    next(error);
  }
};

// ── RESTORE ────────────────────────────────────────────────────────
export const restoreRecipeCost = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, recipeCostId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !recipeCostId) {
      res
        .status(400)
        .json({ ok: false, message: 'Organization ID and Recipe Cost ID are required' });
      return;
    }

    const recipe = await recipeCostService.restoreRecipeCost(
      organizationId,
      recipeCostId,
      userId
    );

    res.status(200).json({ ok: true, message: 'Recipe cost restored', data: recipe });
  } catch (error) {
    next(error);
  }
};

// ── HARD DELETE ───────────────────────────────────────────────────
export const hardDeleteRecipeCost = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, recipeCostId } = req.params;

    if (!organizationId || !recipeCostId) {
      res
        .status(400)
        .json({ ok: false, message: 'Organization ID and Recipe Cost ID are required' });
      return;
    }

    await recipeCostService.hardDeleteRecipeCost(organizationId, recipeCostId);

    res.status(200).json({ ok: true, message: 'Recipe cost permanently deleted' });
  } catch (error) {
    next(error);
  }
};