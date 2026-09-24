import mongoose, { Types } from 'mongoose';
// import WastageAdjustmentModel, {
//   IWastageAdjustment,
//   WastageAdjustmentType,
// } from './wastageAdjustment.model.js';
// import { InventoryModel } from '../inventory/inventory.model.js';
import { ApiError } from '../../utils/apiError.js';
import WastageAdjustmentModel, { IWastageAdjustment, WastageAdjustmentType } from '../../models/wasteAdjustment_model/wastageAdjustment.model.js';
import { InventoryModel } from '../../models/inventory_model/Inventory.model.js';

interface CreateWastageAdjustmentInput {
  inventoryId: string | Types.ObjectId;
  type: WastageAdjustmentType;
  quantity: number;
  reason?: string;
}

// ── CREATE (transactional: log entry + inventory stock reduction) ─
export const createWastageAdjustment = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: CreateWastageAdjustmentInput
): Promise<IWastageAdjustment> => {
  const session = await mongoose.startSession();

  try {
    let entry!: IWastageAdjustment;

    await session.withTransaction(async () => {
      const inventoryItem = await InventoryModel.findOne({
        _id: data.inventoryId,
        organizationId,
      }).session(session);

      if (!inventoryItem) {
        throw new ApiError(404, 'Inventory item not found');
      }

      if (inventoryItem.inStock < data.quantity) {
        throw new ApiError(400, 'Quantity exceeds current stock on hand');
      }

      inventoryItem.inStock -= data.quantity;
      inventoryItem.value = inventoryItem.inStock * inventoryItem.rate;
      await inventoryItem.save({ session });

      const created = await WastageAdjustmentModel.create(
        [
          {
            organizationId,
            inventoryId: data.inventoryId,
            type: data.type,
            quantity: data.quantity,
            reason: data.reason,
            createdBy: userId,
          },
        ],
        { session }
      );

      

      entry = created[0]!;
    });

    return entry;
  } finally {
    session.endSession();
  }
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getWastageAdjustmentList = async (
  organizationId: string | Types.ObjectId
): Promise<IWastageAdjustment[]> => {
  const entries = await WastageAdjustmentModel.find({ organizationId, isActive: true })
    .populate('inventoryId', 'material unit rate')
    .sort({ createdAt: -1 });

  return entries;
};

// ── LIST (inactive / soft-deleted, full detail) ──────────────────
export const getInactiveWastageAdjustmentList = async (
  organizationId: string | Types.ObjectId
): Promise<IWastageAdjustment[]> => {
  const entries = await WastageAdjustmentModel.find({ organizationId, isActive: false })
    .populate('inventoryId', 'material unit rate')
    .sort({ updatedAt: -1 });

  return entries;
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getWastageAdjustmentById = async (
  organizationId: string | Types.ObjectId,
  wastageAdjustmentId: string | Types.ObjectId
): Promise<IWastageAdjustment> => {
  const entry = await WastageAdjustmentModel.findOne({
    _id: wastageAdjustmentId,
    organizationId,
  }).populate('inventoryId', 'material unit rate');

  if (!entry) {
    throw new ApiError(404, 'Wastage/Adjustment entry not found');
  }

  return entry;
};

// ── UPDATE ────────────────────────────────────────────────────────
// Note: only updates type/reason. It does NOT re-adjust inventory stock —
// changing the quantity after the fact needs an explicit reversal +
// re-apply flow, not a plain field update.
export const updateWastageAdjustment = async (
  organizationId: string | Types.ObjectId,
  wastageAdjustmentId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<Pick<IWastageAdjustment, 'type' | 'reason'>>
): Promise<IWastageAdjustment> => {
  const entry = await WastageAdjustmentModel.findOneAndUpdate(
    { _id: wastageAdjustmentId, organizationId },
    { ...data, updatedBy: userId },
    { new: true, runValidators: true }
  );

  if (!entry) {
    throw new ApiError(404, 'Wastage/Adjustment entry not found');
  }

  return entry;
};

// ── SOFT DELETE (isActive: false) ─────────────────────────────────
export const softDeleteWastageAdjustment = async (
  organizationId: string | Types.ObjectId,
  wastageAdjustmentId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IWastageAdjustment> => {
  const entry = await WastageAdjustmentModel.findOneAndUpdate(
    { _id: wastageAdjustmentId, organizationId },
    { isActive: false, updatedBy: userId },
    { new: true }
  );

  if (!entry) {
    throw new ApiError(404, 'Wastage/Adjustment entry not found');
  }

  return entry;
};

// ── RESTORE (isActive: false → true) ──────────────────────────────
export const restoreWastageAdjustment = async (
  organizationId: string | Types.ObjectId,
  wastageAdjustmentId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IWastageAdjustment> => {
  const entry = await WastageAdjustmentModel.findOneAndUpdate(
    { _id: wastageAdjustmentId, organizationId },
    { isActive: true, updatedBy: userId },
    { new: true }
  );

  if (!entry) {
    throw new ApiError(404, 'Wastage/Adjustment entry not found');
  }

  return entry;
};

// ── HARD DELETE (permanent) ───────────────────────────────────────
export const hardDeleteWastageAdjustment = async (
  organizationId: string | Types.ObjectId,
  wastageAdjustmentId: string | Types.ObjectId
): Promise<void> => {
  const entry = await WastageAdjustmentModel.findOneAndDelete({
    _id: wastageAdjustmentId,
    organizationId,
  });

  if (!entry) {
    throw new ApiError(404, 'Wastage/Adjustment entry not found');
  }
};