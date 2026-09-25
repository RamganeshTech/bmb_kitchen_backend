import { Schema, model, Document, Types } from 'mongoose';

export interface IDayClosing extends Document {
  organizationId: Types.ObjectId;
  outletId: Types.ObjectId;
  closingNo: string;
  closingDate: string;

  // Today's summary snapshot (persisted at the time of closing)
  totalSales: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  onlinePaid: number;
  creditAmount: number;
  discountsGiven: number;
  cashExpensesPaidOut: number;
  totalExpensesToday: number;
  billsSettled: number;
  cancelledOrders: number;

  expectedCash: number;
  actualCash: number;
  difference: number;
  closedBy: Types.ObjectId;
  note: string;
  status: 'locked' | 'reopened';
  reopenedBy: Types.ObjectId | null;
  reopenedAt: Date | null;
  reopenReason: string | null;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId | null;
}

const DayClosingSchema = new Schema<IDayClosing>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'OrganizationModel', required: true },
    outletId: { type: Schema.Types.ObjectId, ref: 'OutletModel', required: true },
    closingNo: { type: String, default: null },
    closingDate: { type: String, required: true },

    // Today's summary snapshot
    totalSales: { type: Number, required: true, min: 0 },
    cashSales: { type: Number, required: true, min: 0, default: 0 },
    upiSales: { type: Number, required: true, min: 0, default: 0 },
    cardSales: { type: Number, required: true, min: 0, default: 0 },
    onlinePaid: { type: Number, required: true, min: 0, default: 0 },
    creditAmount: { type: Number, required: true, min: 0, default: 0 },
    discountsGiven: { type: Number, required: true, min: 0, default: 0 },
    cashExpensesPaidOut: { type: Number, required: true, min: 0, default: 0 },
    totalExpensesToday: { type: Number, required: true, min: 0, default: 0 },
    billsSettled: { type: Number, required: true, min: 0, default: 0 },
    cancelledOrders: { type: Number, required: true, min: 0, default: 0 },

    expectedCash: { type: Number, required: true, min: 0 },
    actualCash: { type: Number, required: true, min: 0 },
    difference: { type: Number, required: true },
    closedBy: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
    note: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['locked', 'reopened'], default: 'locked' },
    reopenedBy: { type: Schema.Types.ObjectId, ref: 'UserModel', default: null },
    reopenedAt: { type: Date, default: null },
    reopenReason: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'UserModel', default: null },
  },
  { timestamps: true }
);

// One closing per outlet per calendar day
DayClosingSchema.index({ organizationId: 1, outletId: 1, closingDate: 1 }, { unique: true });

DayClosingSchema.pre('save', async function (this: IDayClosing) {
  if (!this.isNew) return;

  const prefix = 'DC-';
  const lastClosing = await DayClosingModel.findOne({
    organizationId: this.organizationId,
    closingNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('closingNo')
    .lean();

  let nextNumber = 1;
  if (lastClosing?.closingNo) {
    const lastNumberStr = lastClosing.closingNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }
  this.closingNo = `${prefix}${String(nextNumber).padStart(3, '0')}`;
});

const DayClosingModel = model<IDayClosing>('DayClosingModel', DayClosingSchema);

export default DayClosingModel;