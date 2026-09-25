import { Schema, model, Document, Types } from 'mongoose';

export interface ITaxRate {
  _id?: Types.ObjectId;
  name: string;
  percentage: number;
  isActive: boolean;
}

export interface ITaxSettings extends Document {
  organizationId: Types.ObjectId;
  mode: 'exclusive' | 'inclusive';
  serviceCharge: number;
  scOnDinein: boolean;
  rates: ITaxRate[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId | null;
}

const TaxRateSchema = new Schema<ITaxRate>(
  {
    name: { type: String, required: true },
    percentage: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: false },
  },
  { _id: true }
);

const TaxSettingsSchema = new Schema<ITaxSettings>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: true,
      unique: true,
    },
    mode: { type: String, enum: ['exclusive', 'inclusive'], default: 'exclusive' },
    serviceCharge: { type: Number, default: 0, min: 0, max: 20 },
    scOnDinein: { type: Boolean, default: true },
    rates: {
      type: [TaxRateSchema],
      default: [
        { name: 'GST 5%', percentage: 5, isActive: true },
        { name: 'GST 12%', percentage: 12, isActive: false },
        { name: 'GST 18%', percentage: 18, isActive: false },
      ],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'UserModel', default: null },
  },
  { timestamps: true }
);

const TaxSettingsModel = model<ITaxSettings>('TaxSettingsModel', TaxSettingsSchema);

export default TaxSettingsModel;