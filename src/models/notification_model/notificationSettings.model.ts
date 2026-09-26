import { Schema, model, Document, Types } from 'mongoose';

export interface INotificationSettings extends Document {
  organizationId: Types.ObjectId;
  channels: {
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
  };
  events: {
    billShare: boolean;
    orderReady: boolean;
    lowStock: boolean;
    dayClosing: boolean;
    newOnline: boolean;
    offerBlast: boolean;
  };
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId | null;
}

const NotificationSettingsSchema = new Schema<INotificationSettings>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: true,
      unique: true,
    },
    channels: {
      whatsapp: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: true },
    },
    events: {
      billShare: { type: Boolean, default: true },
      orderReady: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: true },
      dayClosing: { type: Boolean, default: true },
      newOnline: { type: Boolean, default: true },
      offerBlast: { type: Boolean, default: false },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'UserModel', default: null },
  },
  { timestamps: true }
);

const NotificationSettingsModel = model<INotificationSettings>(
  'NotificationSettingsModel',
  NotificationSettingsSchema
);

export default NotificationSettingsModel;