import MenuCategoryModel, { type IMenuCategory } from '../../models/menu_models/menuCategory.model.js';
import { ApiError } from '../../utils/apiError.js';
import type { Types } from 'mongoose';

// ── CREATE ────────────────────────────────────────────────────────
export const createMenuCategory = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: { name: string; description?: string }
): Promise<IMenuCategory> => {
  const existingCategory = await MenuCategoryModel.findOne({
    organizationId,
    name: { $regex: new RegExp(`^${data.name}$`, 'i') }, // Case-insensitive check
  });

  if (existingCategory) {
    throw new ApiError(409, 'Menu category with this name already exists');
  }

  const category = await MenuCategoryModel.create({
    ...data,
    organizationId,
    createdBy: userId,
  });

  return category;
};

// ── GET ALL ACTIVE ────────────────────────────────────────────────
export const getAllActiveMenuCategories = async (
  organizationId: string | Types.ObjectId
): Promise<IMenuCategory[]> => {
  return MenuCategoryModel.find({ organizationId, isActive: true }).sort({ createdAt: -1 });
};

// ── GET ALL INACTIVE ──────────────────────────────────────────────
export const getAllInactiveMenuCategories = async (
  organizationId: string | Types.ObjectId
): Promise<IMenuCategory[]> => {
  return MenuCategoryModel.find({ organizationId, isActive: false }).sort({ createdAt: -1 });
};

// ── GET DROPDOWN (ID, NO, NAME ONLY) ──────────────────────────────
export const getMenuCategoryDropdown = async (
  organizationId: string | Types.ObjectId
): Promise<Array<{ _id: Types.ObjectId; menuCategoryNo: string; name: string }>> => {
  return MenuCategoryModel.find({ organizationId, isActive: true })
    .select('_id menuCategoryNo name')
    .sort({ name: 1 }) // Sorted alphabetically for clean dropdown UX
    .lean();
};

// ── GET SINGLE BY ID ──────────────────────────────────────────────
export const getMenuCategoryById = async (
  organizationId: string | Types.ObjectId,
  categoryId: string
): Promise<IMenuCategory> => {
  const category = await MenuCategoryModel.findOne({ _id: categoryId, organizationId });
  if (!category) throw new ApiError(404, 'Menu category not found');
  return category;
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateMenuCategory = async (
  organizationId: string | Types.ObjectId,
  categoryId: string,
  userId: string | Types.ObjectId,
  updates: Partial<Pick<IMenuCategory, 'name' | 'description'>>
): Promise<IMenuCategory> => {
  const category = await MenuCategoryModel.findOneAndUpdate(
    { _id: categoryId, organizationId },
    { $set: { ...updates, updatedBy: userId } },
    { new: true, runValidators: true }
  );

  if (!category) throw new ApiError(404, 'Menu category not found');
  return category;
};

// ── SOFT DELETE (DEACTIVATE) ──────────────────────────────────────
export const softDeleteMenuCategory = async (
  organizationId: string | Types.ObjectId,
  categoryId: string,
  userId: string | Types.ObjectId
): Promise<void> => {
  const category = await MenuCategoryModel.findOneAndUpdate(
    { _id: categoryId, organizationId },
    { $set: { isActive: false, updatedBy: userId } }
  );

  if (!category) throw new ApiError(404, 'Menu category not found');
};

// ── RECOVER (ACTIVATE) ────────────────────────────────────────────
export const recoverMenuCategory = async (
  organizationId: string | Types.ObjectId,
  categoryId: string,
  userId: string | Types.ObjectId
): Promise<void> => {
  const category = await MenuCategoryModel.findOneAndUpdate(
    { _id: categoryId, organizationId },
    { $set: { isActive: true, updatedBy: userId } }
  );

  if (!category) throw new ApiError(404, 'Menu category not found');
};

// ── HARD DELETE ───────────────────────────────────────────────────
export const hardDeleteMenuCategory = async (
  organizationId: string | Types.ObjectId,
  categoryId: string
): Promise<void> => {
  const category = await MenuCategoryModel.findOneAndDelete({ _id: categoryId, organizationId });
  
  if (!category) throw new ApiError(404, 'Menu category not found');
};