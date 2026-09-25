import { Schema, model, Document, Types } from 'mongoose';

export interface IRecipeIngredient {
  inventoryId: Types.ObjectId;
  unit: string;
  rate: number;
  unitValue: number;
}

export interface IRecipeCost extends Document {
  organizationId: Types.ObjectId;
  recipeCostNo: string;
  menuItemId: Types.ObjectId;
  ingredients: IRecipeIngredient[];
  totalPrice: number;
  grossMargin: number;
  sellingPrice: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const recipeIngredientSchema = new Schema<IRecipeIngredient>(
  {
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryModel',
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    unitValue: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const recipeCostSchema = new Schema<IRecipeCost>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: true,
    },
    recipeCostNo: {
      type: String,
    },
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItemModel',
      required: true,
    },
    ingredients: {
      type: [recipeIngredientSchema],
      default: [],
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    grossMargin: {
      type: Number,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserModel',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserModel',
      default: null,
    },
  },
  { timestamps: true }
);

recipeCostSchema.index({ organizationId: 1, recipeCostNo: 1 }, { unique: true });

recipeCostSchema.pre('save', async function (this: IRecipeCost) {
  this.totalPrice = this.ingredients.reduce((sum, ing) => sum + ing.unitValue * ing.rate, 0);

  if (this.sellingPrice > 0) {
    this.grossMargin = ((this.sellingPrice - this.totalPrice) / this.sellingPrice) * 100;
  }

  if (!this.isNew) {
    return;
  }

  const prefix = 'RC-';

  const lastRecipe = await RecipeCostModel.findOne({
    organizationId: this.organizationId,
    recipeCostNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('recipeCostNo')
    .lean();

  let nextNumber = 1;

  if (lastRecipe?.recipeCostNo) {
    const lastNumberStr = lastRecipe.recipeCostNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  const paddedNumber = String(nextNumber).padStart(3, '0');
  this.recipeCostNo = `${prefix}${paddedNumber}`;
});

const RecipeCostModel = model<IRecipeCost>('RecipeCostModel', recipeCostSchema);


export default RecipeCostModel