import MenuItemModel, { type IMenuItem } from '../../models/menu_models/menuItem.model.js';
import { ApiError } from '../../utils/apiError.js';
import  { Types } from 'mongoose';
import { uploadFileToS3 } from '../../utils/s3Upload.js';
import { IUpload } from '../../models/user_models/user.model.js';


export const MAX_MENU_ITEM_IMAGES = 5;

export const assertImages = (files: Express.Multer.File[]) => {
  for (const file of files) {
    if (!file.mimetype.startsWith('image/')) {
      throw new ApiError(400, `Only image files are allowed (${file.originalname})`);
    }
  }
};


const uploadImages = async (files: Express.Multer.File[]) =>
  Promise.all(
    files.map(async (file) => {
      const up = await uploadFileToS3(file);
      return {
        type: 'image' as const,
        key: up.key,
        url: up.url,
        originalName: up.originalName,
        uploadedAt: up.uploadedAt,
      };
    })
  );

// ── CREATE ────────────────────────────────────────────────────────
export const createMenuItem = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<IMenuItem>,
    files: Express.Multer.File[] = []

): Promise<IMenuItem> => {
  const existingItem = await MenuItemModel.findOne({
    organizationId,
    name: { $regex: new RegExp(`^${data.name}$`, 'i') },
  });

  if (existingItem) {
    throw new ApiError(409, 'Menu item with this name already exists');
  }

  if (files && files?.length > MAX_MENU_ITEM_IMAGES) {
    throw new ApiError(400, `You can upload up to ${MAX_MENU_ITEM_IMAGES} images per item`);
  }


    assertImages(files);

      const images = await uploadImages(files);


  const item = await MenuItemModel.create({
    ...data,
    images,
    organizationId,
    createdBy: userId,
  });

  return item;
};


export interface IMenuItemFilters {
  search?: string;
  categoryId?: string | string[];
  foodType?: 'Veg' | 'Non-veg' | 'Egg' | string;
  minPrice?: number | string;
  maxPrice?: number | string;
  maxPrepTime?: number | string;
  hasVariants?: boolean | string;
  hasAddOns?: boolean | string;
  sortBy?: 'name' | 'basePrice' | 'prepTime' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// ── GET ALL ACTIVE ────────────────────────────────────────────────
export const getAllActiveMenuItems = async (
  organizationId: string | Types.ObjectId,
  filters: IMenuItemFilters = {}
): Promise<IMenuItem[]> => {
 const query:any = {
    organizationId: new Types.ObjectId(organizationId),
    isActive: true,
  };

  // 1. Search by Name or Item Number (Case-insensitive regex)
  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [
      { name: { $regex: searchRegex } },
      { menuItemNo: { $regex: searchRegex } },
    ];
  }

  // 2. Filter by Category ID (supports single ID or comma-separated / array)
  if (filters.categoryId) {
    if (Array.isArray(filters.categoryId)) {
      query.categoryId = {
        $in: filters.categoryId.map((id) => new Types.ObjectId(id)),
      };
    } else if (typeof filters.categoryId === 'string') {
      const categoryIds = filters.categoryId
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (categoryIds.length === 1) {
        query.categoryId = new Types.ObjectId(categoryIds[0]);
      } else if (categoryIds.length > 1) {
        query.categoryId = {
          $in: categoryIds.map((id) => new Types.ObjectId(id)),
        };
      }
    }
  }

  // 3. Filter by Food Type (Veg, Non-veg, Egg - supports comma-separated)
  if (filters.foodType) {
    if (typeof filters.foodType === 'string' && filters.foodType.includes(',')) {
      const foodTypes = filters.foodType.split(',').map((t) => t.trim());
      query.foodType = { $in: foodTypes as any };
    } else {
      query.foodType = filters.foodType as any;
    }
  }

  // 4. Base Price Range (minPrice / maxPrice)
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.basePrice = {};
    if (filters.minPrice !== undefined && filters.minPrice !== '') {
      query.basePrice.$gte = Number(filters.minPrice);
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
      query.basePrice.$lte = Number(filters.maxPrice);
    }
  }

  // 5. Max Preparation Time
  if (filters.maxPrepTime !== undefined && filters.maxPrepTime !== '') {
    query.prepTime = { $lte: Number(filters.maxPrepTime) };
  }

  // 6. Has Variants Filter ($exists + $ne: [])
  if (filters.hasVariants !== undefined && filters.hasVariants !== '') {
    const wantsVariants = filters.hasVariants === true || filters.hasVariants === 'true';
    if (wantsVariants) {
      query['variants.0'] = { $exists: true }; // At least 1 item
    } else {
      query.variants = { $size: 0 };
    }
  }

  // 7. Has Add-ons Filter
  if (filters.hasAddOns !== undefined && filters.hasAddOns !== '') {
    const wantsAddOns = filters.hasAddOns === true || filters.hasAddOns === 'true';
    if (wantsAddOns) {
      query['addOns.0'] = { $exists: true }; // At least 1 item
    } else {
      query.addOns = { $size: 0 };
    }
  }

  // 8. Sorting Configuration
  const sortDirection = filters.sortOrder === 'asc' ? 1 : -1;
  const sortField = filters.sortBy || 'createdAt';
  const sortOptions: Record<string, 1 | -1> = { [sortField]: sortDirection };

  return MenuItemModel.find(query)
    .populate('categoryId', '_id name menuCategoryNo')
    .sort(sortOptions);
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


// ── ADD EXTRA IMAGES ──────────────────────────────────────────────
export const addMenuItemImages = async (
  organizationId: string,
  menuItemId: string,
  userId: string,
  files: Express.Multer.File[]
): Promise<IMenuItem> => {
  const item = await MenuItemModel.findOne({ _id: menuItemId, organizationId });
  if (!item) throw new ApiError(404, 'Menu item not found');

  const current = item.images ?? [];
  if (current.length + files.length > MAX_MENU_ITEM_IMAGES) {
    throw new ApiError(
      400,
      `An item can have up to ${MAX_MENU_ITEM_IMAGES} images (currently ${current.length})`
    );
  }
  assertImages(files);

  const uploaded = await uploadImages(files);
  item.images = [...current, ...uploaded] as IUpload[];
  item.updatedBy = userId as unknown as Types.ObjectId;
  await item.save();

  return item;
};

// ── REMOVE ONE IMAGE ──────────────────────────────────────────────
export const removeMenuItemImage = async (
  organizationId: string,
  menuItemId: string,
  imageId: string,
  userId: string
): Promise<IMenuItem> => {
  const item = await MenuItemModel.findOne({ _id: menuItemId, organizationId });
  if (!item) throw new ApiError(404, 'Menu item not found');

  const current = (item.images ?? []) as (IUpload & { _id: Types.ObjectId })[];
  const target = current.find((img) => String(img._id) === imageId);
  if (!target) throw new ApiError(404, 'Image not found');

  item.images = current.filter((img) => String(img._id) !== imageId) as IUpload[];
  item.updatedBy = userId as unknown as Types.ObjectId;
  await item.save();

  // Best effort: the record is already gone, so a failed S3 delete shouldn't fail the request
  // try {
  //   if (target.key) await deleteFileFromS3(target.key);
  // } catch (err) {
  //   console.error('Failed to delete menu item image from S3:', err);
  // }

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