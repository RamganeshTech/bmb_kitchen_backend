import { Schema, model, Document, Types } from 'mongoose';

export type TicketCategory =
  | 'Billing / POS'
  | 'Printer'
  | 'Inventory'
  | 'Reports'
  | 'Integration'
  | 'Account & plan'
  | 'Other';

export type TicketPriority = 'Low' | 'Medium' | 'High';
export type TicketStatus = 'Open' | 'In progress' | 'Closed';

export interface ISupportTicket extends Document {
  organizationId: Types.ObjectId;
  outletId: Types.ObjectId;
  ticketNo: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  details: string;
  status: TicketStatus;
  raisedBy: Types.ObjectId;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId | null;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'OrganizationModel', required: true },
    outletId: { type: Schema.Types.ObjectId, ref: 'OutletModel', required: true },
    ticketNo: { type: String, default: null },
    subject: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Billing / POS',
        'Printer',
        'Inventory',
        'Reports',
        'Integration',
        'Account & plan',
        'Other',
      ],
      default: 'Other',
    },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    details: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Open', 'In progress', 'Closed'], default: 'Open' },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'UserModel', default: null },
  },
  { timestamps: true }
);

SupportTicketSchema.index({ organizationId: 1, ticketNo: 1 }, { unique: true });

SupportTicketSchema.pre('save', async function (this: ISupportTicket) {
  if (!this.isNew) return;

  const prefix = 'TKT-';
  const lastTicket = await SupportTicketModel.findOne({
    organizationId: this.organizationId,
    ticketNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('ticketNo')
    .lean();

  let nextNumber = 1;
  if (lastTicket?.ticketNo) {
    const lastNumberStr = lastTicket.ticketNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }
  this.ticketNo = `${prefix}${String(nextNumber).padStart(4, '0')}`;
});

const SupportTicketModel = model<ISupportTicket>('SupportTicketModel', SupportTicketSchema);

export default SupportTicketModel;