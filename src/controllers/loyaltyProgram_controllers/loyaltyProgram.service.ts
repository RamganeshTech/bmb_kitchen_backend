import { Types } from 'mongoose';
import { ApiError } from '../../utils/apiError.js';
import LoyaltyProgramModel, { ILoyaltyProgram } from '../../models/loyaltyProgram_model/loyaltyProgram.model.js';

// ── GET (by organization) ──────────────────────────────────────────
export const getLoyaltyProgram = async (
  organizationId: string | Types.ObjectId
): Promise<ILoyaltyProgram> => {
  const program = await LoyaltyProgramModel.findOne({ organizationId });

  if (!program) {
    throw new ApiError(404, 'Loyalty programme not set up for this organization');
  }

  return program;
};

// ── CREATE (one-time setup per organization) ────────────────────────
export const createLoyaltyProgram = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<ILoyaltyProgram>
): Promise<ILoyaltyProgram> => {
  const existing = await LoyaltyProgramModel.findOne({ organizationId });

  if (existing) {
    throw new ApiError(409, 'Loyalty programme already exists for this organization');
  }

  const program = await LoyaltyProgramModel.create({
    ...data,
    organizationId,
    createdBy: userId,
  });

  return program;
};

// ── UPDATE (rules, tiers, enable/disable) ───────────────────────────
export const updateLoyaltyProgram = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<ILoyaltyProgram>
): Promise<ILoyaltyProgram> => {
  const program = await LoyaltyProgramModel.findOneAndUpdate(
    { organizationId },
    { ...data, updatedBy: userId },
    { new: true, runValidators: true }
  );

  if (!program) {
    throw new ApiError(404, 'Loyalty programme not set up for this organization');
  }

  return program;
};