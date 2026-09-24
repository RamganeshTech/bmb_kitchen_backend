import mongoose, { Types } from 'mongoose';
import { IInventory, InventoryModel } from '../../models/inventory_model/Inventory.model.js';
import { ApiError } from '../../utils/apiError.js';
import WastageAdjustmentModel, { IWastageAdjustment } from '../../models/wasteAdjustment_model/wastageAdjustment.model.js';

// ── CREATE ────────────────────────────────────────────────────────
export const createInventory = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<IInventory>
): Promise<IInventory> => {
  const existingItem = await InventoryModel.findOne({
    organizationId,
    material: { $regex: new RegExp(`^${data.material}$`, 'i') },
  });

  if (existingItem) {
    throw new ApiError(409, 'Inventory item with this material name already exists');
  }

  const item = await InventoryModel.create({
    ...data,
    organizationId,
    createdBy: userId,
  });

  return item;
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getInventoryList = async (
  organizationId: string | Types.ObjectId
): Promise<IInventory[]> => {
  const items = await InventoryModel.find({
    organizationId,
    isActive: true,
  })
    .populate('vendorId', 'name _id')
    .sort({ createdAt: -1 });

  return items;
};

// ── LIST (inactive / soft-deleted, full detail) ──────────────────
export const getInactiveInventoryList = async (
  organizationId: string | Types.ObjectId
): Promise<IInventory[]> => {
  const items = await InventoryModel.find({
    organizationId,
    isActive: false,
  })
    .populate('vendorId', 'name _id')
    .sort({ updatedAt: -1 });

  return items;
};

// ── DROPDOWN (material, rate, _id only — active items) ───────────
export const getInventoryDropdown = async (
  organizationId: string | Types.ObjectId
): Promise<Pick<IInventory, 'material' | 'rate'>[]> => {
  const items = await InventoryModel.find(
    { organizationId, isActive: true },
    { material: 1, rate: 1 }
  ).sort({ material: 1 });

  return items;
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getInventoryById = async (
  organizationId: string | Types.ObjectId,
  inventoryId: string | Types.ObjectId
): Promise<IInventory> => {
  const item = await InventoryModel.findOne({
    _id: inventoryId,
    organizationId,
  }).populate('vendorId', 'name _id');

  if (!item) {
    throw new ApiError(404, 'Inventory item not found');
  }

  return item;
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateInventory = async (
  organizationId: string | Types.ObjectId,
  inventoryId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<IInventory>
): Promise<IInventory> => {
  if (data.material) {
    const existingItem = await InventoryModel.findOne({
      organizationId,
      _id: { $ne: inventoryId },
      material: { $regex: new RegExp(`^${data.material}$`, 'i') },
    });

    if (existingItem) {
      throw new ApiError(409, 'Inventory item with this material name already exists');
    }
  }

  const item = await InventoryModel.findOneAndUpdate(
    { _id: inventoryId, organizationId },
    { ...data, updatedBy: userId },
    { new: true, runValidators: true }
  );

  if (!item) {
    throw new ApiError(404, 'Inventory item not found');
  }

  return item;
};

// ── SOFT DELETE (isActive: false) ─────────────────────────────────
export const softDeleteInventory = async (
  organizationId: string | Types.ObjectId,
  inventoryId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IInventory> => {
  const item = await InventoryModel.findOneAndUpdate(
    { _id: inventoryId, organizationId },
    { isActive: false, updatedBy: userId },
    { new: true }
  );

  if (!item) {
    throw new ApiError(404, 'Inventory item not found');
  }

  return item;
};

// ── HARD DELETE (permanent) ───────────────────────────────────────
export const hardDeleteInventory = async (
  organizationId: string | Types.ObjectId,
  inventoryId: string | Types.ObjectId
): Promise<void> => {
  const item = await InventoryModel.findOneAndDelete({
    _id: inventoryId,
    organizationId,
  });

  if (!item) {
    throw new ApiError(404, 'Inventory item not found');
  }
};



// ── RESTORE (isActive: false → true) ──────────────────────────────
export const restoreInventory = async (
  organizationId: string | Types.ObjectId,
  inventoryId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IInventory> => {
  const item = await InventoryModel.findOneAndUpdate(
    { _id: inventoryId, organizationId },
    { isActive: true, updatedBy: userId },
    { new: true }
  );
 
  if (!item) {
    throw new ApiError(404, 'Inventory item not found');
  }
 
  return item;
};




// ── ADJUST STOCK (add or remove, logged to WastageAdjustment) ─────
export const adjustInventoryStock = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  inventoryId: string | Types.ObjectId,
  action: 'add' | 'remove',
  quantity: number,
  reason?: string
): Promise<IInventory> => {
  const session = await mongoose.startSession();
 
  try {
    let inventoryItem!: IInventory;
 
    await session.withTransaction(async () => {
      const item = await InventoryModel.findOne({ _id: inventoryId, organizationId }).session(
        session
      );
 
      if (!item) {
        throw new ApiError(404, 'Inventory item not found');
      }
 
      if (action === 'remove' && item.inStock < quantity) {
        throw new ApiError(400, 'Quantity exceeds current stock on hand');
      }
 
      item.inStock = action === 'add' ? item.inStock + quantity : item.inStock - quantity;
      item.value = item.inStock * item.rate;
      await item.save({ session });
 
      await WastageAdjustmentModel.create(
        [
          {
            organizationId,
            inventoryId,
            type: 'adjustment',
            action,
            quantity,
            unit: item.unit,
            reason,
            createdBy: userId,
          },
        ] as any,
        { session }
      );
 
      inventoryItem = item;
    });
 
    return inventoryItem;
  } finally {
    session.endSession();
  }
};
 