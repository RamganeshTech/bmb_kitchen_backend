import { Types } from 'mongoose';
import { ApiError } from '../../utils/apiError.js';
import OfferModel, { IOffer } from '../../models/offer_model/offer.model.js';

// ── CREATE ────────────────────────────────────────────────────────
export const createOffer = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<IOffer>
): Promise<IOffer> => {
  if (data.code) {
    const existingCode = await OfferModel.findOne({
      organizationId,
      code: data.code.toUpperCase(),
    });

    if (existingCode) {
      throw new ApiError(409, 'Offer with this code already exists');
    }
  }

  const offer = await OfferModel.create({
    ...data,
    organizationId,
    createdBy: userId,
  });

  return offer;
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getOfferList = async (
  organizationId: string | Types.ObjectId
): Promise<IOffer[]> => {
  const offers = await OfferModel.find({ organizationId, isActive: true })
    .populate('categoryIds', 'name')
    .populate('menuItemIds', 'name')
    .sort({ createdAt: -1 });

  return offers;
};

// ── LIST (inactive / soft-deleted, full detail) ──────────────────
export const getInactiveOfferList = async (
  organizationId: string | Types.ObjectId
): Promise<IOffer[]> => {
  const offers = await OfferModel.find({ organizationId, isActive: false })
    .populate('categoryIds', 'name')
    .populate('menuItemIds', 'name')
    .sort({ updatedAt: -1 });

  return offers;
};

// ── DROPDOWN (title, code, _id only — active offers) ──────────────
export const getOfferDropdown = async (
  organizationId: string | Types.ObjectId
): Promise<Pick<IOffer, 'title' | 'code'>[]> => {
  const offers = await OfferModel.find(
    { organizationId, isActive: true },
    { title: 1, code: 1 }
  ).sort({ title: 1 });

  return offers;
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getOfferById = async (
  organizationId: string | Types.ObjectId,
  offerId: string | Types.ObjectId
): Promise<IOffer> => {
  const offer = await OfferModel.findOne({ _id: offerId, organizationId })
    .populate('categoryIds', 'name')
    .populate('menuItemIds', 'name');

  if (!offer) {
    throw new ApiError(404, 'Offer not found');
  }

  return offer;
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateOffer = async (
  organizationId: string | Types.ObjectId,
  offerId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<IOffer>
): Promise<IOffer> => {
  if (data.code) {
    const existingCode = await OfferModel.findOne({
      organizationId,
      _id: { $ne: offerId },
      code: data.code.toUpperCase(),
    });

    if (existingCode) {
      throw new ApiError(409, 'Offer with this code already exists');
    }
  }

  const offer = await OfferModel.findOneAndUpdate(
    { _id: offerId, organizationId },
    { ...data, updatedBy: userId },
    { new: true, runValidators: true }
  );

  if (!offer) {
    throw new ApiError(404, 'Offer not found');
  }

  return offer;
};

// ── SOFT DELETE (isActive: false) ─────────────────────────────────
export const softDeleteOffer = async (
  organizationId: string | Types.ObjectId,
  offerId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IOffer> => {
  const offer = await OfferModel.findOneAndUpdate(
    { _id: offerId, organizationId },
    { isActive: false, updatedBy: userId },
    { new: true }
  );

  if (!offer) {
    throw new ApiError(404, 'Offer not found');
  }

  return offer;
};

// ── RESTORE (isActive: false → true) ──────────────────────────────
export const restoreOffer = async (
  organizationId: string | Types.ObjectId,
  offerId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IOffer> => {
  const offer = await OfferModel.findOneAndUpdate(
    { _id: offerId, organizationId },
    { isActive: true, updatedBy: userId },
    { new: true }
  );

  if (!offer) {
    throw new ApiError(404, 'Offer not found');
  }

  return offer;
};

// ── HARD DELETE (permanent) ───────────────────────────────────────
export const hardDeleteOffer = async (
  organizationId: string | Types.ObjectId,
  offerId: string | Types.ObjectId
): Promise<void> => {
  const offer = await OfferModel.findOneAndDelete({ _id: offerId, organizationId });

  if (!offer) {
    throw new ApiError(404, 'Offer not found');
  }
};