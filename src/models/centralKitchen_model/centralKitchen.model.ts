import { Schema, model, Document, Types } from 'mongoose';

export interface ITransferLine {
  inventoryId: Types.ObjectId;
  quantity: number;
}

export interface ICentralKitchenTransfer extends Document {
  organizationId: Types.ObjectId;
  transferNo: string;
  fromOutletId: Types.ObjectId;
  toOutletId: Types.ObjectId;
  lines: ITransferLine[];
  value: number;
  status: 'Requested' | 'Approved' | 'Dispatched' | 'Received';
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId | null;
}

const TransferLineSchema = new Schema<ITransferLine>(
  {
    inventoryId: { type: Schema.Types.ObjectId, ref: 'InventoryModel', required: true },
    quantity: { type: Number, required: true },
  },
  { _id: true }
);

const CentralKitchenTransferSchema = new Schema<ICentralKitchenTransfer>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'OrganizationModel', required: true },
    transferNo: { type: String, default: null },
    fromOutletId: { type: Schema.Types.ObjectId, ref: 'OutletModel', required: true },
    toOutletId: { type: Schema.Types.ObjectId, ref: 'OutletModel', required: true },
    lines: { type: [TransferLineSchema], default: [] },
    value: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Dispatched', 'Received'],
      default: 'Requested',
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'UserModel', default: null },
  },
  { timestamps: true }
);

CentralKitchenTransferSchema.index({ organizationId: 1, transferNo: 1 }, { unique: true });

CentralKitchenTransferSchema.pre('save', async function (this: ICentralKitchenTransfer) {
  if (!this.isNew) {
    return;
  }

  const prefix = 'TR-';

  const lastTransfer = await CentralKitchenTransferModel.findOne({
    organizationId: this.organizationId,
    expenseNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('transferNo')
    .lean();

  let nextNumber = 1;

  if (lastTransfer?.transferNo) {
    const lastNumberStr = lastTransfer.transferNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  const paddedNumber = String(nextNumber).padStart(3, '0');
  this.transferNo = `${prefix}${paddedNumber}`;
});

const CentralKitchenTransferModel = model<ICentralKitchenTransfer>(
  'CentralKitchenTransferModel',
  CentralKitchenTransferSchema
);

export default CentralKitchenTransferModel;