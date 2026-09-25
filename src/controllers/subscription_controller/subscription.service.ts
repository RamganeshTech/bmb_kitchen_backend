import { Types } from 'mongoose';
import { ApiError } from '../../utils/apiError.js';
import SubscriptionModel from '../../models/subscription_model/subscription.model.js';

const VALID_PLANS = ['Starter', 'Growth', 'Chain'] as const;
type PlanName = (typeof VALID_PLANS)[number];

interface CreateSubscriptionInput {
  plan: PlanName;
  price: number;
  cycle?: 'monthly' | 'yearly';
  outletsIncluded: number;
  renewsAt: string | Date;
}

interface ChangePlanInput {
  plan: PlanName;
  price: number;
  outletsIncluded: number;
}

interface AddInvoiceInput {
  invoiceNo: string;
  date?: string | Date;
  amount: number;
  status?: 'Paid' | 'Pending' | 'Failed';
}

export const getSubscription = async (organizationId: string) => {
  const subscription = await SubscriptionModel.findOne({ organizationId });
  if (!subscription) throw new ApiError(404, 'Subscription not found for this organization');
  return subscription;
};

export const createSubscription = async (
  organizationId: string,
  userId: string,
  payload: CreateSubscriptionInput
) => {
  const existing = await SubscriptionModel.findOne({ organizationId });
  if (existing) {
    throw new ApiError(409, 'Subscription already exists for this organization');
  }

  if (!VALID_PLANS.includes(payload.plan)) {
    throw new ApiError(400, `plan must be one of: ${VALID_PLANS.join(', ')}`);
  }

  const subscription = await SubscriptionModel.create({
    organizationId,
    plan: payload.plan,
    price: payload.price,
    cycle: payload.cycle,
    outletsIncluded: payload.outletsIncluded,
    renewsAt: payload.renewsAt,
    createdBy: userId,
  });

  return subscription;
};

export const changePlan = async (
  organizationId: string,
  userId: string,
  payload: ChangePlanInput
) => {
  const { plan, price, outletsIncluded } = payload;

  if (!VALID_PLANS.includes(plan)) {
    throw new ApiError(400, `plan must be one of: ${VALID_PLANS.join(', ')}`);
  }

  const subscription = await SubscriptionModel.findOneAndUpdate(
    { organizationId },
    { plan, price, outletsIncluded, updatedBy: userId },
    { new: true }
  );

  if (!subscription) throw new ApiError(404, 'Subscription not found for this organization');
  return subscription;
};

export const addInvoice = async (
  organizationId: string,
  userId: string,
  payload: AddInvoiceInput
) => {
  const { invoiceNo, date, amount, status } = payload;

  if (!invoiceNo || amount === undefined || amount < 0) {
    throw new ApiError(400, 'invoiceNo and a valid amount are required');
  }

  const subscription = await SubscriptionModel.findOne({ organizationId });
  if (!subscription) throw new ApiError(404, 'Subscription not found for this organization');

  const duplicate = subscription.invoices.some((inv) => inv.invoiceNo === invoiceNo);
  if (duplicate) throw new ApiError(409, `Invoice ${invoiceNo} already exists`);

  subscription.invoices.push({
    invoiceNo,
    date: date ? new Date(date) : new Date(),
    amount,
    status: status || 'Pending',
  } as any);
  subscription.updatedBy = new Types.ObjectId(userId);
  await subscription.save();

  return subscription;
};

export const listInvoices = async (organizationId: string) => {
  const subscription = await SubscriptionModel.findOne({ organizationId }).select('invoices');
  if (!subscription) throw new ApiError(404, 'Subscription not found for this organization');
  return subscription.invoices;
};