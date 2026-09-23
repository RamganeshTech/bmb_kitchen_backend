import MenuItemModel, { type IMenuItem } from '../../models/menu_models/menuItem.model.js';
import { ApiError } from '../../utils/apiError.js';
import type { Types } from 'mongoose';

// ── CREATE ────────────────────────────────────────────────────────
export const createMenuItem = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<IMenuItem>
): Promise<IMenuItem> => {
  const existingItem = await MenuItemModel.findOne({
    organizationId,
    name: { $regex: new RegExp(`^${data.name}$`, 'i') },
  });

  if (existingItem) {
    throw new ApiError(409, 'Menu item with this name already exists');
  }

  const item = await MenuItemModel.create({
    ...data,
    organizationId,
    createdBy: userId,
  });

  return item;
};

// ── GET ALL ACTIVE ────────────────────────────────────────────────
export const getAllActiveMenuItems = async (
  organizationId: string | Types.ObjectId
): Promise<IMenuItem[]> => {
  return MenuItemModel.find({ organizationId, isActive: true })
    .populate('categoryId', '_id name menuCategoryNo')
    .sort({ createdAt: -1 });
};

// ── GET ALL INACTIVE ──────────────────────────────────────────────
export const getAllInactiveMenuItems = async (
  organizationId: string | Types.ObjectId
): Promise<IMenuItem[]> => {
  return MenuItemModel.find({ organizationId, isActive: false })
    .populate('categoryId', '_id name menuCategoryNo')
    .sort({ createdAt: -1 });
};

// ── GET SINGLE BY ID ──────────────────────────────────────────────
export const getMenuItemById = async (
  organizationId: string | Types.ObjectId,
  itemId: string
): Promise<IMenuItem> => {
  const item = await MenuItemModel.findOne({ _id: itemId, organizationId })
    .populate('categoryId', '_id name menuCategoryNo');
  
  if (!item) throw new ApiError(404, 'Menu item not found');
  return item;
};
// ── GET DROPDOWN (ID, NO, NAME, PRICE BY CATEGORY) ────────────────
export const getMenuItemDropdown = async (
  organizationId: string | Types.ObjectId,
  categoryId: string | Types.ObjectId
): Promise<Array<{ _id: Types.ObjectId; menuItemNo: string; name: string; basePrice: number }>> => {
  return MenuItemModel.find({ organizationId, categoryId, isActive: true })
    .select('_id menuItemNo name basePrice')
    .sort({ name: 1 })
    .lean();
};


// ── UPDATE ────────────────────────────────────────────────────────
export const updateMenuItem = async (
  organizationId: string | Types.ObjectId,
  itemId: string,
  userId: string | Types.ObjectId,
  updates: Partial<IMenuItem>
): Promise<IMenuItem> => {
  const item = await MenuItemModel.findOneAndUpdate(
    { _id: itemId, organizationId },
    { $set: { ...updates, updatedBy: userId } },
    { new: true, runValidators: true }
  ).populate('categoryId', '_id name menuCategoryNo');

  if (!item) throw new ApiError(404, 'Menu item not found');
  return item;
};

// ── SOFT DELETE (DEACTIVATE) ──────────────────────────────────────
export const softDeleteMenuItem = async (
  organizationId: string | Types.ObjectId,
  itemId: string,
  userId: string | Types.ObjectId
): Promise<void> => {
  const item = await MenuItemModel.findOneAndUpdate(
    { _id: itemId, organizationId },
    { $set: { isActive: false, updatedBy: userId } }
  );

  if (!item) throw new ApiError(404, 'Menu item not found');
};

// ── RECOVER (ACTIVATE) ────────────────────────────────────────────
export const recoverMenuItem = async (
  organizationId: string | Types.ObjectId,
  itemId: string,
  userId: string | Types.ObjectId
): Promise<void> => {
  const item = await MenuItemModel.findOneAndUpdate(
    { _id: itemId, organizationId },
    { $set: { isActive: true, updatedBy: userId } }
  );

  if (!item) throw new ApiError(404, 'Menu item not found');
};

// ── HARD DELETE ───────────────────────────────────────────────────
export const hardDeleteMenuItem = async (
  organizationId: string | Types.ObjectId,
  itemId: string
): Promise<void> => {
  const item = await MenuItemModel.findOneAndDelete({ _id: itemId, organizationId });
  
  if (!item) throw new ApiError(404, 'Menu item not found');
};