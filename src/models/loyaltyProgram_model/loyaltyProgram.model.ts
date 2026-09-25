import { Schema, model, Document, Types } from 'mongoose';

export interface ILoyaltyTier {
  name: string;
  minLifetimeSpend: number;
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
      required: true,
      trim: true,
    },
    minLifetimeSpend: {
      type: Number,
      required: true,
      min: 0,
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
        { name: 'Silver', minLifetimeSpend: 0 },
        { name: 'Gold', minLifetimeSpend: 5000 },
        { name: 'Platinum', minLifetimeSpend: 15000 },
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