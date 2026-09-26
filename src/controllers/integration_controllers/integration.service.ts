import IntegrationModel, { IntegrationCategory } from '../../models/integration_model/integration.model.js';
import { ApiError } from '../../utils/apiError.js';

const DEFAULT_INTEGRATIONS: { name: string; category: IntegrationCategory; note: string }[] = [
  { name: 'Swiggy', category: 'Aggregator', note: 'Menu + order sync' },
  { name: 'Zomato', category: 'Aggregator', note: 'Menu + order sync' },
  { name: 'Razorpay', category: 'Payments', note: 'UPI / card settlement' },
  { name: 'AiSensy WhatsApp', category: 'Messaging', note: 'Bill share + campaigns' },
  { name: 'Tally', category: 'Accounting', note: 'Sales & purchase export' },
  { name: 'Google Reviews', category: 'Reputation', note: 'Feedback requests' },
];

/**
 * Seeds the standard integration catalog for a brand-new organization.
 * Idempotent — skips any name that already exists for the org, so it's
 * safe to call again without creating duplicates.
 */
export const seedDefaultIntegrations = async (organizationId: string, userId: string) => {
  const existing = await IntegrationModel.find({ organizationId }).select('name').lean();
  const existingNames = new Set(existing.map((i) => i.name));

  const toCreate = DEFAULT_INTEGRATIONS.filter((i) => !existingNames.has(i.name)).map((i) => ({
    organizationId,
    name: i.name,
    category: i.category,
    note: i.note,
    status: 'not_connected' as const,
    createdBy: userId,
  }));

  if (!toCreate.length) return [];

  return IntegrationModel.insertMany(toCreate);
};

export const listIntegrations = async (organizationId: string) => {
  return IntegrationModel.find({ organizationId }).sort({ category: 1, name: 1 });
};

export const getIntegrationById = async (organizationId: string, id: string) => {
  const integration = await IntegrationModel.findOne({ _id: id, organizationId });
  if (!integration) throw new ApiError(404, 'Integration not found');
  return integration;
};

export const connectIntegration = async (organizationId: string, userId: string, id: string) => {
  const integration = await IntegrationModel.findOne({ _id: id, organizationId });
  if (!integration) throw new ApiError(404, 'Integration not found');

  if (integration.status === 'connected') {
    throw new ApiError(400, `${integration.name} is already connected`);
  }

  integration.status = 'connected';
  integration.connectedSince = new Date();
  integration.updatedBy = userId as any;
  await integration.save();

  return integration;
};

export const disconnectIntegration = async (organizationId: string, userId: string, id: string) => {
  const integration = await IntegrationModel.findOne({ _id: id, organizationId });
  if (!integration) throw new ApiError(404, 'Integration not found');

  if (integration.status === 'not_connected') {
    throw new ApiError(400, `${integration.name} is already disconnected`);
  }

  integration.status = 'not_connected';
  integration.connectedSince = null;
  integration.updatedBy = userId as any;
  await integration.save();

  return integration;
};