import { Schema, model, Document, Types } from 'mongoose';

export interface IOutlet extends Document {
  organizationId: Types.ObjectId;
  outletNo: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const outletSchema = new Schema<IOutlet>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: true,
    },
    outletNo: {
      type: String,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // short reference code shown across the app (e.g. order/receipt tags), max 5 chars per the reference HTML
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'OUT',
    },
    address: {
      type: String,
      default: null,
      trim: true,
    },
    phone: {
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

outletSchema.index({ organizationId: 1, outletNo: 1 }, { unique: true });
// short code unique per organization (the reference HTML uses it as a display identifier)
// outletSchema.index({ organizationId: 1, code: 1 }, { unique: true });

outletSchema.pre('save', async function (this: IOutlet) {
  if (!this.isNew) {
    return;
  }

  const prefix = 'OUT-';

  const lastOutlet = await OutletModel.findOne({
    organizationId: this.organizationId,
    outletNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('outletNo')
    .lean();

  let nextNumber = 1;

  if (lastOutlet?.outletNo) {
    const lastNumberStr = lastOutlet.outletNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  const paddedNumber = String(nextNumber).padStart(3, '0');
  this.outletNo = `${prefix}${paddedNumber}`;
});

const OutletModel = model<IOutlet>('OutletModel', outletSchema);

export default OutletModel;