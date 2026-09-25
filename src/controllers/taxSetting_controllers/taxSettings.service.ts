import { Types } from 'mongoose';
import { ApiError } from '../../utils/apiError.js';
import TaxSettingsModel from '../../models/taxSettings_model/taxSetting.model.js';

interface UpsertTaxSettingsInput {
  mode?: 'exclusive' | 'inclusive';
  serviceCharge?: number;
  scOnDinein?: boolean;
}

interface AddTaxRateInput {
  name: string;
  percentage: number;
}

export const getTaxSettings = async (organizationId: string) => {
  const settings = await TaxSettingsModel.findOne({ organizationId });
  if (!settings) throw new ApiError(404, 'Tax settings not found for this organization');
  return settings;
};

export const createTaxSettings = async (
  organizationId: string,
  userId: string,
  payload: UpsertTaxSettingsInput
) => {
  const existing = await TaxSettingsModel.findOne({ organizationId });
  if (existing) {
    throw new ApiError(409, 'Tax settings already exist for this organization');
  }

  const settings = await TaxSettingsModel.create({
    organizationId,
    mode: payload.mode,
    serviceCharge: payload.serviceCharge,
    scOnDinein: payload.scOnDinein,
    createdBy: userId,
  });

  return settings;
};

export const updateTaxSettings = async (
  organizationId: string,
  userId: string,
  payload: UpsertTaxSettingsInput
) => {
  if (payload.serviceCharge !== undefined && (payload.serviceCharge < 0 || payload.serviceCharge > 20)) {
    throw new ApiError(400, 'Service charge must be between 0 and 20');
  }

  const settings = await TaxSettingsModel.findOneAndUpdate(
    { organizationId },
    { ...payload, updatedBy: userId },
    { new: true }
  );

  if (!settings) throw new ApiError(404, 'Tax settings not found for this organization');
  return settings;
};

export const addTaxRate = async (
  organizationId: string,
  userId: string,
  payload: AddTaxRateInput
) => {
  const { name, percentage } = payload;

  if (!name || percentage === undefined || percentage < 0) {
    throw new ApiError(400, 'Slab name and a valid percent are required');
  }

  const settings = await TaxSettingsModel.findOne({ organizationId });
  if (!settings) throw new ApiError(404, 'Tax settings not found for this organization');

  const isFirstRate = settings.rates.length === 0;
  settings.rates.push({ name, percentage, isActive: isFirstRate } as any);
  settings.updatedBy = new Types.ObjectId(userId);
  await settings.save();

  return settings;
};

export const setDefaultTaxRate = async (
  organizationId: string,
  userId: string,
  rateId: string
) => {
  const settings = await TaxSettingsModel.findOne({ organizationId });
  if (!settings) throw new ApiError(404, 'Tax settings not found for this organization');

  const rateExists = settings.rates.some((r) => r._id?.toString() === rateId);
  if (!rateExists) throw new ApiError(404, 'Tax slab not found');

  settings.rates.forEach((r) => {
    r.isActive = r._id?.toString() === rateId;
  });
  settings.updatedBy = new Types.ObjectId(userId);
  await settings.save();

  return settings;
};