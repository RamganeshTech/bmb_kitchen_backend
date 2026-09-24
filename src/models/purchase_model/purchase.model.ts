import { Schema, model, Document, Types } from 'mongoose';

export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface IPurchaseItem {
  inventoryId: Types.ObjectId;
  quantity: number;
  rate: number;
  amount: number;
}

export interface IPurchase extends Document {
  organizationId: Types.ObjectId;
  purchaseNo: string;
  vendorId: Types.ObjectId;
  items: IPurchaseItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseItemSchema = new Schema<IPurchaseItem>(
  {
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryModel',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      // kept in sync automatically: quantity * rate
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const purchaseSchema = new Schema<IPurchase>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: true,
    },
    purchaseNo: {
      type: String,
      // uniqueness enforced per-organization by the compound index below
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'VendorModel',
      required: true,
    },
    items: {
      type: [purchaseItemSchema],
      required: true,
      validate: {
        validator: (items: IPurchaseItem[]) => Array.isArray(items) && items.length > 0,
        message: 'A purchase must have at least one item',
      },
    },
    totalAmount: {
      // kept in sync automatically: sum of items[].amount
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending',
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

// purchaseNo unique per organization (not globally)
purchaseSchema.index({ organizationId: 1, purchaseNo: 1 }, { unique: true });

// Auto-generate purchaseNo (e.g. PUR-001) per organization,
// and keep item amounts + totalAmount in sync
purchaseSchema.pre('save', async function (this: IPurchase) {
  this.items.forEach((item) => {
    item.amount = item.quantity * item.rate;
  });
  this.totalAmount = this.items.reduce((sum, item) => sum + item.amount, 0);

  if (!this.isNew) {
    return;
  }

  const prefix = 'PUR-';

  const lastPurchase = await PurchaseModel.findOne({
    organizationId: this.organizationId,
    purchaseNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('purchaseNo')
    .lean();

  let nextNumber = 1;

  if (lastPurchase?.purchaseNo) {
    const lastNumberStr = lastPurchase.purchaseNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  const paddedNumber = String(nextNumber).padStart(3, '0');
  this.purchaseNo = `${prefix}${paddedNumber}`;
});

 const PurchaseModel = model<IPurchase>('PurchaseModel', purchaseSchema);

 export default PurchaseModel