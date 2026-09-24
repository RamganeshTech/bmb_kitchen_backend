import { Schema, model, Document, Types } from 'mongoose';

export type WastageAdjustmentType = 'wastage' | 'adjustment';

export interface IWastageAdjustment extends Document {
  organizationId: Types.ObjectId;
  wastageNo: string;
  inventoryId: Types.ObjectId;
  action?: 'add' | 'remove'; // <-- Add this field
  type: WastageAdjustmentType;
  quantity: number;
  reason: string | null;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const wastageAdjustmentSchema = new Schema<IWastageAdjustment>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: true,
    },
    wastageNo: {
      type: String,
    },
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryModel',
      required: true,
    },
    type: {
      type: String,
      enum: ['wastage', 'adjustment'],
      required: true,
    },
    action: { type: String, enum: ['add', 'remove'] }, // <-- Add this field
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      default: null,
      trim: true,
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

wastageAdjustmentSchema.index({ organizationId: 1, wastageNo: 1 }, { unique: true });

wastageAdjustmentSchema.pre('save', async function (this: IWastageAdjustment) {
  if (!this.isNew) {
    return;
  }

  const prefix = 'WA-';

  const lastEntry = await WastageAdjustmentModel.findOne({
    organizationId: this.organizationId,
    wastageNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('wastageNo')
    .lean();

  let nextNumber = 1;

  if (lastEntry?.wastageNo) {
    const lastNumberStr = lastEntry.wastageNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  const paddedNumber = String(nextNumber).padStart(3, '0');
  this.wastageNo = `${prefix}${paddedNumber}`;
});

const WastageAdjustmentModel = model<IWastageAdjustment>(
  'WastageAdjustmentModel',
  wastageAdjustmentSchema
);

export default WastageAdjustmentModel;