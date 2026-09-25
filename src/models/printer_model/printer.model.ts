import { Schema, model, Document, Types } from 'mongoose';

export interface IPrinter extends Document {
  organizationId: Types.ObjectId;
  outletId: Types.ObjectId;
  name: string;
  type: 'Bill' | 'KOT';
  printerModel: string;
  conn: string;
  size: '80mm' | '58mm';
  copies: number;
  categories: string[]; // menu categories routed to this printer — only meaningful when type === 'KOT'
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId | null;
}

const PrinterSchema = new Schema<IPrinter>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'OrganizationModel', required: true },
    outletId: { type: Schema.Types.ObjectId, ref: 'OutletModel', required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Bill', 'KOT'], required: true, default: 'KOT' },
    printerModel: { type: String, trim: true, default: null },
    conn: { type: String, trim: true, default: '' }, // e.g. "USB" or "LAN 192.168.1.44"
    size: { type: String, enum: ['80mm', '58mm'], default: '80mm' },
    copies: { type: Number, min: 1, max: 4, default: 1 },
    categories: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'UserModel', default: null },
  },
  { timestamps: true }
);

PrinterSchema.index({ organizationId: 1 });


const PrinterModel = model<IPrinter>('PrinterModel', PrinterSchema);

export default PrinterModel;