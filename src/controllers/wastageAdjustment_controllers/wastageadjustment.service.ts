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
    .populate('inventoryId', 'material unit rate _id')
    .sort({ createdAt: -1 });

  return entries;
};

// ── LIST (inactive / soft-deleted, full detail) ──────────────────
export const getInactiveWastageAdjustmentList = async (
  organizationId: string | Types.ObjectId
): Promise<IWastageAdjustment[]> => {
  const entries = await WastageAdjustmentModel.find({ organizationId, isActive: false })
    .populate('inventoryId', 'material unit rate _id')
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
  }).populate('inventoryId', 'material unit rate _id');

  if (!entry) {
    throw new ApiError(404, 'Wastage/Adjustment entry not found');
  }

  return entry;
};

// ── UPDATE (transactional: entry changes + inventory stock difference) ─
// Changing the quantity applies only the difference to inventory stock.
// e.g. wastage 5 -> 8 reduces stock by 3 more; 5 -> 2 gives 3 back.
export const updateWastageAdjustment = async (
  organizationId: string | Types.ObjectId,
  wastageAdjustmentId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<Pick<IWastageAdjustment, 'type' | 'reason' | 'quantity'>>
): Promise<IWastageAdjustment> => {
  const session = await mongoose.startSession();

  try {
    let updated!: IWastageAdjustment;

    await session.withTransaction(async () => {
      const entry = await WastageAdjustmentModel.findOne({
        _id: wastageAdjustmentId,
        organizationId,
      }).session(session);

      if (!entry) {
        throw new ApiError(404, 'Wastage/Adjustment entry not found');
      }

      const { type, reason, quantity } = data;

      if (quantity !== undefined && quantity !== entry.quantity) {
        const inventoryItem = await InventoryModel.findOne({
          _id: entry.inventoryId,
          organizationId,
        }).session(session);

        if (!inventoryItem) {
          throw new ApiError(404, 'Inventory item not found');
        }

        // Entries logged by "adjust stock -> add" increased stock; everything else reduced it
        const isAddition =
          (entry as IWastageAdjustment & { action?: 'add' | 'remove' }).action === 'add';

        const delta = quantity - entry.quantity;
        const stockChange = isAddition ? delta : -delta;
        const newStock = inventoryItem.inStock + stockChange;

        if (newStock < 0) {
          throw new ApiError(400, 'Quantity exceeds current stock on hand');
        }

        inventoryItem.inStock = newStock;
        inventoryItem.value = inventoryItem.inStock * inventoryItem.rate;
        await inventoryItem.save({ session });

        entry.quantity = quantity;
      }

      if (type !== undefined) entry.type = type;
      if (reason !== undefined) entry.reason = reason;
      entry.updatedBy = userId as unknown as Types.ObjectId;

      await entry.save({ session });
      updated = entry;
    });

    return updated;
  } finally {
    session.endSession();
  }
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