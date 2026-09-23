import { Schema, model, Document, Types } from 'mongoose';

export type FoodType = 'Veg' | 'Non-veg' | 'Egg';

export interface IVariant {
  name: string;
  priceDifference: number; // relative to base price (e.g., -50 for Half, +100 for Full)
}

export interface IAddOn {
  name: string;
  price: number;
}

export interface IMenuItem extends Document {
  organizationId: Types.ObjectId;
  menuItemNo: string;
  name: string;
  categoryId: Types.ObjectId;
  basePrice: number;
  foodType: FoodType;
  prepTime: number; // in minutes
  variants: IVariant[];
  addOns: IAddOn[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schema for Variants (no automatic _id generation per item)
const variantSchema = new Schema<IVariant>(
  {
    name: { type: String, required: true, trim: true },
    priceDifference: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

// Sub-schema for Add-ons (no automatic _id generation per item)
const addOnSchema = new Schema<IAddOn>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const menuItemSchema = new Schema<IMenuItem>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    menuItemNo: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuCategory',
      required: [true, 'CategoryId is required'],
      index: true,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative'],
    },
    foodType: {
      type: String,
      enum: ['Veg', 'Non-veg', 'Egg'],
      required: [true, 'Food type is required'],
      default: 'Non-veg',
    },
    prepTime: {
      type: Number,
      required: [true, 'Prep time is required'],
      min: [0, 'Prep time cannot be negative'],
      default: 0,
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    addOns: {
      type: [addOnSchema],
      default: [],
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
  {
    timestamps: true,
  }
);

// Compound unique index ensuring menuItemNo is unique per organization
menuItemSchema.index({ organizationId: 1, menuItemNo: 1 }, { unique: true });

// Compound index for fast tenant menu listings filtered by active state
menuItemSchema.index({ organizationId: 1, isActive: 1 });

// Auto-generate menuItemNo (e.g. MI-001) per organization
menuItemSchema.pre('save', async function (this: IMenuItem) {
  if (!this.isNew) {
    return;
  }

  const prefix = 'MI-';

  const lastItem = await MenuItemModel.findOne({
    organizationId: this.organizationId,
    menuItemNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('menuItemNo')
    .lean();

  let nextNumber = 1;

  if (lastItem?.menuItemNo) {
    const lastNumberStr = lastItem.menuItemNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  const paddedNumber = String(nextNumber).padStart(3, '0');
  this.menuItemNo = `${prefix}${paddedNumber}`;
});

const MenuItemModel = model<IMenuItem>('MenuItem', menuItemSchema);

export default MenuItemModel;