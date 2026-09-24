import { Types } from 'mongoose';
import { ApiError } from '../../utils/apiError.js';
import OutletModel, { IOutlet } from '../../models/outlet_models/outlet.model.js';
import OrderModel from '../../models/order_models/order.model.js';

// ── CREATE ────────────────────────────────────────────────────────
export const createOutlet = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<IOutlet>
): Promise<IOutlet> => {
  const existingName = await OutletModel.findOne({
    organizationId,
    name: { $regex: new RegExp(`^${data.name}$`, 'i') },
  });

  if (existingName) {
    throw new ApiError(409, 'Outlet with this name already exists');
  }

  const outlet = await OutletModel.create({
    ...data,
    organizationId,
    createdBy: userId,
  });

  return outlet;
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getOutletList = async (
  organizationId: string | Types.ObjectId
): Promise<IOutlet[]> => {
  const outlets = await OutletModel.find({ organizationId, isActive: true }).sort({
    createdAt: -1,
  });

  return outlets;
};

// ── LIST (inactive / soft-deleted, full detail) ──────────────────
export const getInactiveOutletList = async (
  organizationId: string | Types.ObjectId
): Promise<IOutlet[]> => {
  const outlets = await OutletModel.find({ organizationId, isActive: false }).sort({
    updatedAt: -1,
  });

  return outlets;
};

// ── DROPDOWN (name, code, _id only — active outlets) ──────────────
export const getOutletDropdown = async (
  organizationId: string | Types.ObjectId
): Promise<Pick<IOutlet, 'name' | 'code'>[]> => {
  const outlets = await OutletModel.find(
    { organizationId, isActive: true },
    { name: 1, code: 1 }
  ).sort({ name: 1 });

  return outlets;
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getOutletById = async (
  organizationId: string | Types.ObjectId,
  outletId: string | Types.ObjectId
): Promise<IOutlet> => {
  const outlet = await OutletModel.findOne({ _id: outletId, organizationId });

  if (!outlet) {
    throw new ApiError(404, 'Outlet not found');
  }

  return outlet;
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateOutlet = async (
  organizationId: string | Types.ObjectId,
  outletId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<IOutlet>
): Promise<IOutlet> => {
  if (data.name) {
    const existingName = await OutletModel.findOne({
      organizationId,
      _id: { $ne: outletId },
      name: { $regex: new RegExp(`^${data.name}$`, 'i') },
    });

    if (existingName) {
      throw new ApiError(409, 'Outlet with this name already exists');
    }
  }

  const outlet = await OutletModel.findOneAndUpdate(
    { _id: outletId, organizationId },
    { ...data, updatedBy: userId },
    { new: true, runValidators: true }
  );

  if (!outlet) {
    throw new ApiError(404, 'Outlet not found');
  }

  return outlet;
};

// ── SOFT DELETE (isActive: false) ─────────────────────────────────
export const softDeleteOutlet = async (
  organizationId: string | Types.ObjectId,
  outletId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IOutlet> => {
  const outlet = await OutletModel.findOneAndUpdate(
    { _id: outletId, organizationId },
    { isActive: false, updatedBy: userId },
    { new: true }
  );

  if (!outlet) {
    throw new ApiError(404, 'Outlet not found');
  }

  return outlet;
};

// ── RESTORE (isActive: false → true) ──────────────────────────────
export const restoreOutlet = async (
  organizationId: string | Types.ObjectId,
  outletId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IOutlet> => {
  const outlet = await OutletModel.findOneAndUpdate(
    { _id: outletId, organizationId },
    { isActive: true, updatedBy: userId },
    { new: true }
  );

  if (!outlet) {
    throw new ApiError(404, 'Outlet not found');
  }

  return outlet;
};

// ── HARD DELETE (blocked if the outlet has order history) ─────────
export const hardDeleteOutlet = async (
  organizationId: string | Types.ObjectId,
  outletId: string | Types.ObjectId
): Promise<void> => {
  const hasOrderHistory = await OrderModel.exists({ organizationId, outletId });

  if (hasOrderHistory) {
    throw new ApiError(409, 'Outlet has order history — cannot delete');
  }

  const outlet = await OutletModel.findOneAndDelete({ _id: outletId, organizationId });

  if (!outlet) {
    throw new ApiError(404, 'Outlet not found');
  }
};