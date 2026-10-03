import { Schema, model, Document, Types } from 'mongoose';

export interface ILoyaltyTier {
  _id?: Types.ObjectId;
  name: string;
  minPoints: number;
  multiplier?: number;
  benefits: string[];
}


export interface ILoyaltyProgram extends Document {
  organizationId: Types.ObjectId;
  isEnabled: boolean;
  spendPerBlock: number;
  pointsPerBlock: number;
  pointValue: number;
  minPointsToRedeem: number;
  pointsExpireAfterDays: number;
  tiers: ILoyaltyTier[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}




const loyaltyTierSchema = new Schema<ILoyaltyTier>(
  {
    name: {
      type: String,
      required: [true, 'Tier name is required'],
      trim: true,
    },
    minPoints: {
      type: Number,
      // required: [true, 'Minimum points is required'],
      // min: [0, 'Minimum points cannot be negative'],
      // validate: {
      //   validator: Number.isInteger,
      //   message: 'Minimum points must be a whole number',
      // },
    },
    multiplier: {
      type: Number,
      // min: [0.01, 'Multiplier must be greater than 0'],
      default: undefined, // optional: the form deletes it when empty
    },
    benefits: {
      type: [{ type: String, trim: true }],
      default: [],
    },
  },
  { _id: true }
);

const loyaltyProgramSchema = new Schema<ILoyaltyProgram>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: true,
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    spendPerBlock: {
      type: Number,
      default: 100,
      min: 0,
    },
    pointsPerBlock: {
      type: Number,
      default: 5,
      min: 0,
    },
    pointValue: {
      type: Number,
      default: 1,
      min: 0,
    },
    minPointsToRedeem: {
      type: Number,
      default: 100,
      min: 0,
    },
    pointsExpireAfterDays: {
      type: Number,
      default: 365,
      min: 0,
    },
    tiers: {
      type: [loyaltyTierSchema],
      default: [
        { name: 'Silver', minPoints: 0, multiplier: 1, benefits: [] },
        { name: 'Gold', minPoints: 500, multiplier: 1.5, benefits: [] },
        { name: 'Platinum', minPoints: 1500, multiplier: 2, benefits: [] },
      ],
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
      default: null,
    },
  },
  { timestamps: true }
);

// one loyalty programme per organization
loyaltyProgramSchema.index({ organizationId: 1 }, { unique: true });

const LoyaltyProgramModel = model<ILoyaltyProgram>('LoyaltyProgramModel', loyaltyProgramSchema);

export default LoyaltyProgramModel;