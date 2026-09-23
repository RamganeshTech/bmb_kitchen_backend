import CustomerModel, { type ICustomer } from '../../models/customer_models/customer.model.js';
import { ApiError } from '../../utils/apiError.js';
import type { Types } from 'mongoose';

// ── CREATE CUSTOMER ───────────────────────────────────────────────
export const createCustomer = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<ICustomer>
): Promise<ICustomer> => {
  const existingCustomer = await CustomerModel.findOne({
    organizationId,
    phone: data.phone,
  });

  if (existingCustomer) {
    throw new ApiError(409, 'Customer with this phone number already exists in this organization');
  }

  const customer = await CustomerModel.create({
    ...data,
    organizationId,
    createdBy: userId,
  });

  return customer;
};

// ── GET ALL ACTIVE ────────────────────────────────────────────────
export const getActiveCustomers = async (
  organizationId: string | Types.ObjectId
): Promise<ICustomer[]> => {
  return CustomerModel.find({ organizationId, isActive: true })
    .sort({ createdAt: -1 });
};

// ── GET ALL INACTIVE ──────────────────────────────────────────────
export const getInactiveCustomers = async (
  organizationId: string | Types.ObjectId
): Promise<ICustomer[]> => {
  return CustomerModel.find({ organizationId, isActive: false })
    .sort({ createdAt: -1 });
};

// ── GET SINGLE BY ID ──────────────────────────────────────────────
export const getCustomerById = async (
  organizationId: string | Types.ObjectId,
  customerId: string
): Promise<ICustomer> => {
  const customer = await CustomerModel.findOne({ _id: customerId, organizationId });
  
  if (!customer) throw new ApiError(404, 'Customer not found');
  return customer;
};

// ── GET DROPDOWN ──────────────────────────────────────────────────
export const getCustomerDropdown = async (
  organizationId: string | Types.ObjectId
): Promise<Array<{ _id: Types.ObjectId; name: string; phone: string; loyaltyPoints: number }>> => {
  return CustomerModel.find({ organizationId, isActive: true })
    .select('_id name phone loyaltyPoints')
    .sort({ name: 1 })
    .lean();
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateCustomer = async (
  organizationId: string | Types.ObjectId,
  customerId: string,
  userId: string | Types.ObjectId,
  updates: Partial<ICustomer>
): Promise<ICustomer> => {
  // If updating phone, check for collisions
  if (updates.phone) {
    const existing = await CustomerModel.findOne({
      organizationId,
      phone: updates.phone,
      _id: { $ne: customerId }
    });
    if (existing) {
      throw new ApiError(409, 'Another customer is already using this phone number');
    }
  }

  const customer = await CustomerModel.findOneAndUpdate(
    { _id: customerId, organizationId },
    { $set: { ...updates, updatedBy: userId } },
    { new: true, runValidators: true }
  );

  if (!customer) throw new ApiError(404, 'Customer not found');
  return customer;
};

// ── SOFT DELETE (DEACTIVATE) ──────────────────────────────────────
export const softDeleteCustomer = async (
  organizationId: string | Types.ObjectId,
  customerId: string,
  userId: string | Types.ObjectId
): Promise<void> => {
  const customer = await CustomerModel.findOneAndUpdate(
    { _id: customerId, organizationId },
    { $set: { isActive: false, updatedBy: userId } }
  );

  if (!customer) throw new ApiError(404, 'Customer not found');
};

// ── RECOVER (ACTIVATE) ────────────────────────────────────────────
export const recoverCustomer = async (
  organizationId: string | Types.ObjectId,
  customerId: string,
  userId: string | Types.ObjectId
): Promise<void> => {
  const customer = await CustomerModel.findOneAndUpdate(
    { _id: customerId, organizationId },
    { $set: { isActive: true, updatedBy: userId } }
  );

  if (!customer) throw new ApiError(404, 'Customer not found');
};

// ── HARD DELETE ───────────────────────────────────────────────────
export const hardDeleteCustomer = async (
  organizationId: string | Types.ObjectId,
  customerId: string
): Promise<void> => {
  const customer = await CustomerModel.findOneAndDelete({ _id: customerId, organizationId });
  
  if (!customer) throw new ApiError(404, 'Customer not found');
};