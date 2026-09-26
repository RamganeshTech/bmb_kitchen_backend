import { Schema, model, Document, Types } from 'mongoose';

export type IntegrationCategory =
  | 'Aggregator'
  | 'Payments'
  | 'Messaging'
  | 'Accounting'
  | 'Reputation';

export type IntegrationStatus = 'connected' | 'not_connected';

export interface IIntegration extends Document {
  organizationId: Types.ObjectId;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  note: string;
  connectedSince: Date | null;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId | null;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'OrganizationModel', required: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Aggregator', 'Payments', 'Messaging', 'Accounting', 'Reputation'],
      required: true,
    },
    status: { type: String, enum: ['connected', 'not_connected'], default: 'not_connected' },
    note: { type: String, trim: true, default: '' },
    connectedSince: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'UserModel', default: null },
  },
  { timestamps: true }
);

// One entry per named integration per organization (e.g. only one "Swiggy" row per org)
IntegrationSchema.index({ organizationId: 1, name: 1 }, { unique: true });

const IntegrationModel = model<IIntegration>('IntegrationModel', IntegrationSchema);

export default IntegrationModel;