import { Schema, model, Document, Types } from 'mongoose';

export type OfferDiscountType = 'percentage' | 'flat';
export type OfferApplicableOn = 'all' | 'category' | 'item';

export interface IOffer extends Document {
  organizationId: Types.ObjectId;
  offerNo: string;
  title: string;
  code: string | null;
  discountType: OfferDiscountType;
  discountValue: number;
  applicableOn: OfferApplicableOn;
  categoryIds: Types.ObjectId[];
  menuItemIds: Types.ObjectId[];
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  startDate: Date;
  endDate: Date;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: true,
    },
    offerNo: {
      type: String,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    applicableOn: {
      type: String,
      enum: ['all', 'category', 'item'],
      default: 'all',
    },
    categoryIds: {
      type: [Schema.Types.ObjectId],
      ref: 'MenuCategoryModel',
      default: [],
    },
    menuItemIds: {
      type: [Schema.Types.ObjectId],
      ref: 'MenuItemModel',
      default: [],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    perCustomerLimit: {
      type: Number,
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
  { timestamps: true }
);

offerSchema.index({ organizationId: 1, offerNo: 1 }, { unique: true });
offerSchema.index(
  { organizationId: 1, code: 1 },
  { unique: true, partialFilterExpression: { code: { $type: 'string' } } }
);

offerSchema.pre('save', async function (this: IOffer) {
  if (!this.isNew) {
    return;
  }

  const prefix = 'OFR-';

  const lastOffer = await OfferModel.findOne({
    organizationId: this.organizationId,
    offerNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('offerNo')
    .lean();

  let nextNumber = 1;

  if (lastOffer?.offerNo) {
    const lastNumberStr = lastOffer.offerNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  const paddedNumber = String(nextNumber).padStart(3, '0');
  this.offerNo = `${prefix}${paddedNumber}`;
});

const OfferModel = model<IOffer>('OfferModel', offerSchema);

export default OfferModel;