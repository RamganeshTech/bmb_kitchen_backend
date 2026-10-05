import { Schema, model, Document, Types } from 'mongoose';
import { IUpload } from '../user_models/user.model.js';

export interface IMenuCategory extends Document {
  organizationId: Types.ObjectId;
  menuCategoryNo: string;
  image: IUpload | null;

  name: string;
  description?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}


const uploadSchema = new Schema<IUpload>({
  type: { type: String, enum: ["image"] },
  key: { type: String, },
  url: { type: String, },
  originalName: String,
  uploadedAt: { type: Date, default: Date.now }
});


const menuCategorySchema = new Schema<IMenuCategory>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    menuCategoryNo: {type: String,trim: true},
    image: { type: uploadSchema, default: null },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
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

// Unique category sequence scoped per organization
menuCategorySchema.index({ organizationId: 1, menuCategoryNo: 1 });

// Auto-generate menuCategoryNo (e.g. MC-001) per organization
menuCategorySchema.pre('save', async function (this: IMenuCategory) {
  if (!this.isNew) {
    return;
  }

  const prefix = 'MC-';

  const lastCategory = await MenuCategoryModel.findOne({
    organizationId: this.organizationId,
    menuCategoryNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('menuCategoryNo')
    .lean();

  let nextNumber = 1;

  if (lastCategory?.menuCategoryNo) {
    const lastNumberStr = lastCategory.menuCategoryNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  const paddedNumber = String(nextNumber).padStart(3, '0');
  this.menuCategoryNo = `${prefix}${paddedNumber}`;
});

const MenuCategoryModel = model<IMenuCategory>('MenuCategory', menuCategorySchema);

export default MenuCategoryModel;