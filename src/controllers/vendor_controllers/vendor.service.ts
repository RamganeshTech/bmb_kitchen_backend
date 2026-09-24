import { Types } from 'mongoose';
// import { VendorModel, IVendor } from './vendor.model.js';
import { ApiError } from '../../utils/apiError.js';
import { IVendor, VendorModel } from '../../models/vendor_model/vendor.model.js';

// ── CREATE ────────────────────────────────────────────────────────
export const createVendor = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<IVendor>
): Promise<IVendor> => {
  const existingVendor = await VendorModel.findOne({
    organizationId,
    vendorName: { $regex: new RegExp(`^${data.vendorName}$`, 'i') },
  });

  if (existingVendor) {
    throw new ApiError(409, 'Vendor with this name already exists');
  }

  const vendor = await VendorModel.create({
    ...data,
    organizationId,
    createdBy: userId,
  });

  return vendor;
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getVendorList = async (
  organizationId: string | Types.ObjectId
): Promise<IVendor[]> => {
  const vendors = await VendorModel.find({
    organizationId,
    isActive: true,
  }).sort({ createdAt: -1 });

  return vendors;
};

// ── LIST (inactive / soft-deleted, full detail) ──────────────────
export const getInactiveVendorList = async (
  organizationId: string | Types.ObjectId
): Promise<IVendor[]> => {
  const vendors = await VendorModel.find({
    organizationId,
    isActive: false,
  }).sort({ updatedAt: -1 });

  return vendors;
};

// ── DROPDOWN (vendorName, _id only — active vendors) ──────────────
export const getVendorDropdown = async (
  organizationId: string | Types.ObjectId
): Promise<Pick<IVendor, 'vendorName'>[]> => {
  const vendors = await VendorModel.find(
    { organizationId, isActive: true },
    { vendorName: 1 }
  ).sort({ vendorName: 1 });

  return vendors;
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getVendorById = async (
  organizationId: string | Types.ObjectId,
  vendorId: string | Types.ObjectId
): Promise<IVendor> => {
  const vendor = await VendorModel.findOne({
    _id: vendorId,
    organizationId,
  });

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  return vendor;
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateVendor = async (
  organizationId: string | Types.ObjectId,
  vendorId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<IVendor>
): Promise<IVendor> => {
  if (data.vendorName) {
    const existingVendor = await VendorModel.findOne({
      organizationId,
      _id: { $ne: vendorId },
      vendorName: { $regex: new RegExp(`^${data.vendorName}$`, 'i') },
    });

    if (existingVendor) {
      throw new ApiError(409, 'Vendor with this name already exists');
    }
  }

  const vendor = await VendorModel.findOneAndUpdate(
    { _id: vendorId, organizationId },
    { ...data, updatedBy: userId },
    { new: true, runValidators: true }
  );

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  return vendor;
};

// ── SOFT DELETE (isActive: false) ─────────────────────────────────
export const softDeleteVendor = async (
  organizationId: string | Types.ObjectId,
  vendorId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IVendor> => {
  const vendor = await VendorModel.findOneAndUpdate(
    { _id: vendorId, organizationId },
    { isActive: false, updatedBy: userId },
    { new: true }
  );

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  return vendor;
};

// ── RESTORE (isActive: false → true) ──────────────────────────────
export const restoreVendor = async (
  organizationId: string | Types.ObjectId,
  vendorId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IVendor> => {
  const vendor = await VendorModel.findOneAndUpdate(
    { _id: vendorId, organizationId },
    { isActive: true, updatedBy: userId },
    { new: true }
  );

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  return vendor;
};

// ── HARD DELETE (permanent) ───────────────────────────────────────
export const hardDeleteVendor = async (
  organizationId: string | Types.ObjectId,
  vendorId: string | Types.ObjectId
): Promise<void> => {
  const vendor = await VendorModel.findOneAndDelete({
    _id: vendorId,
    organizationId,
  });

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
};