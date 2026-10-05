import MenuCategoryModel, { type IMenuCategory } from '../../models/menu_models/menuCategory.model.js';
import { ApiError } from '../../utils/apiError.js';
import type { Types } from 'mongoose';
import { uploadFileToS3 } from '../../utils/s3Upload.js';
import { IUpload } from '../../models/user_models/user.model.js';


const assertCategoryImage = (file: Express.Multer.File) => {
  if (!file.mimetype.startsWith('image/')) {
    throw new ApiError(400, `Only image files are allowed (${file.originalname})`);
  }
};

const uploadCategoryImage = async (file: Express.Multer.File) => {
  const up = await uploadFileToS3(file); // same import as your menu item service
  return {
    type: 'image' as const,
    key: up.key,
    url: up.url,
    originalName: up.originalName,
    uploadedAt: up.uploadedAt,
  };
};


// ── CREATE ────────────────────────────────────────────────────────
export const createMenuCategory = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: { name: string; description?: string },
  file?: Express.Multer.File

): Promise<IMenuCategory> => {
  const existingCategory = await MenuCategoryModel.findOne({
    organizationId,
    name: { $regex: new RegExp(`^${data.name}$`, 'i') }, // Case-insensitive check
  });

  if (existingCategory) {
    throw new ApiError(409, 'Menu category with this name already exists');
  }

  // Upload only after the duplicate check, so a 409 never leaves an orphan file in S3
  let image = null;
  if (file) {
    assertCategoryImage(file);
    image = await uploadCategoryImage(file);
  }


  const category = await MenuCategoryModel.create({
    ...data,
    organizationId,
    createdBy: userId,
  });

  return category;
};

// ── UPDATE PICTURE ────────────────────────────────────────────────
export const updateMenuCategoryImage = async (
  organizationId: string,
  categoryId: string,
  userId: string,
  file: Express.Multer.File
): Promise<IMenuCategory> => {
  const category = await MenuCategoryModel.findOne({ _id: categoryId, organizationId });
  if (!category) throw new ApiError(404, 'Menu category not found');

  assertCategoryImage(file);
  const newImage = await uploadCategoryImage(file);

  category.image = newImage as IUpload;
  category.updatedBy = userId as unknown as Types.ObjectId;
  await category.save();

  return category;
};

// ── REMOVE PICTURE ────────────────────────────────────────────────
export const removeMenuCategoryImage = async (
  organizationId: string,
  categoryId: string,
  userId: string
): Promise<IMenuCategory> => {
  const category = await MenuCategoryModel.findOne({ _id: categoryId, organizationId });
  if (!category) throw new ApiError(404, 'Menu category not found');
  if (!category.image) throw new ApiError(404, 'This category has no image');

  category.image = null;
  category.updatedBy = userId as unknown as Types.ObjectId;
  await category.save();

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