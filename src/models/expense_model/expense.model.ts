import { Schema, model, Document, Types } from 'mongoose';

export const EXPENSE_CATEGORIES = [
  'rent',
  'salary & wages',
  'Electricity',
  'Gas',
  'Water',
  'Maintenance',
  'Marketing',
  'Packaging',
  'Transport',
  'Licences',
  'Miscellaneous',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_MODES = ['Cash', 'UPI', 'Bank transfer', 'Card', 'Cheque'] as const;

export type ExpensePaymentMode = (typeof PAYMENT_MODES)[number];

export interface IExpense extends Document {
  organizationId: Types.ObjectId;
  outletId: Types.ObjectId;
  expenseNo: string;
  date: Date;
  category: ExpenseCategory;
  description: string;
  payee: string | null;
  paymentMode: ExpensePaymentMode;
  amount: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: true,
    },
    outletId: {
      type: Schema.Types.ObjectId,
      ref: 'OutletModel',
      required: [true, 'outlet ID is required'],
    },

    expenseNo: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    payee: {
      type: String,
      default: null,
      trim: true,
    },
    paymentMode: {
      type: String,
      enum: PAYMENT_MODES,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
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
      default: null,
    },
  },
  { timestamps: true }
);

expenseSchema.index({ organizationId: 1, expenseNo: 1 }, { unique: true });

expenseSchema.pre('save', async function (this: IExpense) {
  if (!this.isNew) {
    return;
  }

  const prefix = 'EXP-';

  const lastExpense = await ExpenseModel.findOne({
    organizationId: this.organizationId,
    expenseNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('expenseNo')
    .lean();

  let nextNumber = 1;

  if (lastExpense?.expenseNo) {
    const lastNumberStr = lastExpense.expenseNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  const paddedNumber = String(nextNumber).padStart(3, '0');
  this.expenseNo = `${prefix}${paddedNumber}`;
});

const ExpenseModel = model<IExpense>('ExpenseModel', expenseSchema);

export default ExpenseModel;