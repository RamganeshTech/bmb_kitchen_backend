import { Schema, model, Document, Types } from 'mongoose';

export type NotificationEventKey =
  | 'billShare'
  | 'orderReady'
  | 'lowStock'
  | 'dayClosing'
  | 'newOnline'
  | 'offerBlast'
  | 'general';

export interface INotification extends Document {
  organizationId: Types.ObjectId;
  outletId: Types.ObjectId | null;
  eventKey: NotificationEventKey;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: Types.ObjectId | null;
  readBy: Types.ObjectId[]; // presence of a userId here = hidden/read for that user only
  createdBy: Types.ObjectId | null;
}

const NotificationSchema = new Schema<INotification>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'OrganizationModel', required: true },
    outletId: { type: Schema.Types.ObjectId, ref: 'OutletModel', default: null },
    eventKey: {
      type: String,
      enum: ['billShare', 'orderReady', 'lowStock', 'dayClosing', 'newOnline', 'offerBlast', 'general'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    relatedEntityType: { type: String, default: null },
    relatedEntityId: { type: Schema.Types.ObjectId, default: null },
    readBy: { type: [Schema.Types.ObjectId], ref: 'UserModel', default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserModel', default: null },
  },
  { timestamps: true }
);

NotificationSchema.index({ organizationId: 1, createdAt: -1 });

const NotificationModel = model<INotification>('NotificationModel', NotificationSchema);

export default NotificationModel;