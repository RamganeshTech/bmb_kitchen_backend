import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as loyaltyProgramService from './loyaltyProgram.service.js';

// ── GET ───────────────────────────────────────────────────────────
export const getLoyaltyProgram = async (
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

    const program = await loyaltyProgramService.getLoyaltyProgram(organizationId);

    res.status(200).json({ ok: true, data: program });
  } catch (error) {
    next(error);
  }
};

// ── CREATE (one-time setup) ─────────────────────────────────────────
export const createLoyaltyProgram = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const {
      isEnabled,
      spendPerBlock,
      pointsPerBlock,
      pointValue,
      minPointsToRedeem,
      pointsExpireAfterDays,
      tiers,
    } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const program = await loyaltyProgramService.createLoyaltyProgram(organizationId, userId, {
      isEnabled,
      spendPerBlock,
      pointsPerBlock,
      pointValue,
      minPointsToRedeem,
      pointsExpireAfterDays,
      tiers,
    });

    res.status(201).json({ ok: true, data: program });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE (rules, tiers, enable/disable) ───────────────────────────
export const updateLoyaltyProgram = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.userId;
    const {
      isEnabled,
      spendPerBlock,
      pointsPerBlock,
      pointValue,
      minPointsToRedeem,
      pointsExpireAfterDays,
      tiers,
    } = req.body;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const program = await loyaltyProgramService.updateLoyaltyProgram(organizationId, userId, {
      isEnabled,
      spendPerBlock,
      pointsPerBlock,
      pointValue,
      minPointsToRedeem,
      pointsExpireAfterDays,
      tiers,
    });

    res.status(200).json({ ok: true, data: program });
  } catch (error) {
    next(error);
  }
};