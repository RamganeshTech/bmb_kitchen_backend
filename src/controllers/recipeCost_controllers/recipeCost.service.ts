import { Types } from 'mongoose';
// import RecipeCostModel, { IRecipeCost, IRecipeIngredient } from './recipeCost.model.js';
import { ApiError } from '../../utils/apiError.js';
import RecipeCostModel, { IRecipeCost, IRecipeIngredient }  from '../../models/recipeCost_model/recipeCost.model.js';

interface RecipeCostInput {
  menuItemId: string | Types.ObjectId;
  ingredients: IRecipeIngredient[];
  sellingPrice?: number;
}

// ── CREATE ────────────────────────────────────────────────────────
export const createRecipeCost = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: RecipeCostInput
): Promise<IRecipeCost> => {
  const existing = await RecipeCostModel.findOne({
    organizationId,
    menuItemId: data.menuItemId,
  });

  if (existing) {
    throw new ApiError(409, 'Recipe cost for this menu item already exists');
  }

  const recipe = await RecipeCostModel.create({
    ...data,
    organizationId,
    createdBy: userId,
  });

  return recipe;
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getRecipeCostList = async (
  organizationId: string | Types.ObjectId
): Promise<IRecipeCost[]> => {
  const recipes = await RecipeCostModel.find({ organizationId, isActive: true })
    .populate('menuItemId', 'name')
    .populate('ingredients.inventoryId', 'material rate')
    .sort({ createdAt: -1 });

  return recipes;
};

// ── LIST (inactive / soft-deleted, full detail) ──────────────────
export const getInactiveRecipeCostList = async (
  organizationId: string | Types.ObjectId
): Promise<IRecipeCost[]> => {
  const recipes = await RecipeCostModel.find({ organizationId, isActive: false })
    .populate('menuItemId', 'name')
    .populate('ingredients.inventoryId', 'material rate')
    .sort({ updatedAt: -1 });

  return recipes;
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getRecipeCostById = async (
  organizationId: string | Types.ObjectId,
  recipeCostId: string | Types.ObjectId
): Promise<IRecipeCost> => {
  const recipe = await RecipeCostModel.findOne({ _id: recipeCostId, organizationId })
    .populate('menuItemId', 'name')
    .populate('ingredients.inventoryId', 'material rate');

  if (!recipe) {
    throw new ApiError(404, 'Recipe cost not found');
  }

  return recipe;
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateRecipeCost = async (
  organizationId: string | Types.ObjectId,
  recipeCostId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<RecipeCostInput>
): Promise<IRecipeCost> => {
  const recipe = await RecipeCostModel.findOne({ _id: recipeCostId, organizationId });

  if (!recipe) {
    throw new ApiError(404, 'Recipe cost not found');
  }

  if (data.ingredients) {
    recipe.ingredients = data.ingredients as IRecipeIngredient[];
  }
  if (data.sellingPrice !== undefined) {
    recipe.sellingPrice = data.sellingPrice;
  }
  if (data.menuItemId) {
    recipe.menuItemId = data.menuItemId as Types.ObjectId;
  }
  recipe.updatedBy = userId as Types.ObjectId;

  await recipe.save();

  return recipe;
};

// ── SOFT DELETE (isActive: false) ─────────────────────────────────
export const softDeleteRecipeCost = async (
  organizationId: string | Types.ObjectId,
  recipeCostId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IRecipeCost> => {
  const recipe = await RecipeCostModel.findOneAndUpdate(
    { _id: recipeCostId, organizationId },
    { isActive: false, updatedBy: userId },
    { new: true }
  );

  if (!recipe) {
    throw new ApiError(404, 'Recipe cost not found');
  }

  return recipe;
};

// ── RESTORE (isActive: false → true) ──────────────────────────────
export const restoreRecipeCost = async (
  organizationId: string | Types.ObjectId,
  recipeCostId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IRecipeCost> => {
  const recipe = await RecipeCostModel.findOneAndUpdate(
    { _id: recipeCostId, organizationId },
    { isActive: true, updatedBy: userId },
    { new: true }
  );

  if (!recipe) {
    throw new ApiError(404, 'Recipe cost not found');
  }

  return recipe;
};

// ── HARD DELETE (permanent) ───────────────────────────────────────
export const hardDeleteRecipeCost = async (
  organizationId: string | Types.ObjectId,
  recipeCostId: string | Types.ObjectId
): Promise<void> => {
  const recipe = await RecipeCostModel.findOneAndDelete({
    _id: recipeCostId,
    organizationId,
  });

  if (!recipe) {
    throw new ApiError(404, 'Recipe cost not found');
  }
};