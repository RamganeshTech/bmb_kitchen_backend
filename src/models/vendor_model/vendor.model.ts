import { Schema, model, Document, Types } from 'mongoose';

export interface IVendor extends Document {
  organizationId: Types.ObjectId;
  vendorNo: string;
  vendorName: string;
  contactPerson: string | null;
  phone: string | null;
  gstin: string | null;
  category: string | null;
  address: string | null;
  paymentTerms: string | null;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: true,
      index: true,
    },
    vendorNo: {
      type: String,
      // uniqueness enforced per-organization by the compound index below
    },
    vendorName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      default: null,
      trim: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    gstin: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      default: null,
      trim: true,
    },
    address: {
      type: String,
      default: null,
      trim: true,
    },
    paymentTerms: {
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

// vendorNo unique per organization (not globally)
vendorSchema.index({ organizationId: 1, vendorNo: 1 }, { unique: true });
// vendorName unique per organization — remove if duplicate vendor names should be allowed
// vendorSchema.index({ organizationId: 1, vendorName: 1 }, { unique: true });

// Auto-generate vendorNo (e.g. VEN-001) per organization
vendorSchema.pre('save', async function (this: IVendor) {
  if (!this.isNew) {
    return;
  }

  const prefix = 'VEN-';

  const lastVendor = await VendorModel.findOne({
    organizationId: this.organizationId,
    vendorNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('vendorNo')
    .lean();

  let nextNumber = 1;

  if (lastVendor?.vendorNo) {
    const lastNumberStr = lastVendor.vendorNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  const paddedNumber = String(nextNumber).padStart(3, '0');
  this.vendorNo = `${prefix}${paddedNumber}`;
});

export const VendorModel = model<IVendor>('VendorModel', vendorSchema);