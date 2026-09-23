import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomer extends Document {
  organizationId: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  
  // Loyalty & Analytics
  loyaltyPoints: number; // Current available points to redeem
  totalVisits: number;   // Incremented on every completed order
  totalSpent: number;    // Lifetime value of the customer
  
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalVisits: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
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
    },
  },
  {
    timestamps: true,
  }
);

// A phone number should be unique per organization/restaurant branch
customerSchema.index({ organizationId: 1, phone: 1 });

const CustomerModel = model<ICustomer>('Customer', customerSchema);

export default CustomerModel;