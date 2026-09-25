import { Schema, model, Document, Types } from 'mongoose';

export interface IInvoice {
  _id?: Types.ObjectId;
  invoiceNo: string;
  date: Date;
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed';
}

export interface ISubscription extends Document {
  organizationId: Types.ObjectId;
  plan: 'Starter' | 'Growth' | 'Chain';
  price: number;
  cycle: 'monthly' | 'yearly';
  outletsIncluded: number;
  startedAt: Date;
  renewsAt: Date;
  status: 'active' | 'expired' | 'cancelled';
  invoices: IInvoice[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId | null;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNo: { type: String, required: true },
    date: { type: Date, required: true, default: new Date() },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Pending' },
  },
  { _id: true }
);

const SubscriptionSchema = new Schema<ISubscription>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: true,
      unique: true,
    },
    plan: { type: String, enum: ['Starter', 'Growth', 'Chain'], required: true, default: 'Starter' },
    price: { type: Number, required: true, min: 0 },
    cycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    outletsIncluded: { type: Number, required: true, min: 1, default: 1 },
    startedAt: { type: Date, required: true, default: Date.now },
    renewsAt: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    invoices: { type: [InvoiceSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'UserModel', default: null },
  },
  { timestamps: true }
);

const SubscriptionModel = model<ISubscription>('SubscriptionModel', SubscriptionSchema);

export default SubscriptionModel;