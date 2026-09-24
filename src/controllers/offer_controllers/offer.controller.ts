import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as offerService from './offer.service.js';

// ── CREATE ────────────────────────────────────────────────────────
export const createOffer = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const {
      title,
      code,
      discountType,
      discountValue,
      applicableOn,
      categoryIds,
      menuItemIds,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      perCustomerLimit,
    } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!title || !discountType || discountValue === undefined || !startDate || !endDate) {
      res.status(400).json({
        ok: false,
        message: 'Title, discount type, discount value, start date, and end date are required',
      });
      return;
    }

    const offer = await offerService.createOffer(organizationId, userId, {
      title,
      code,
      discountType,
      discountValue,
      applicableOn,
      categoryIds,
      menuItemIds,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      perCustomerLimit,
    });

    res.status(201).json({ ok: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getOfferList = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const offers = await offerService.getOfferList(organizationId);

    res.status(200).json({ ok: true, data: offers });
  } catch (error) {
    next(error);
  }
};

// ── LIST (inactive / soft-deleted) ────────────────────────────────
export const getInactiveOfferList = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const offers = await offerService.getInactiveOfferList(organizationId);

    res.status(200).json({ ok: true, data: offers });
  } catch (error) {
    next(error);
  }
};

// ── DROPDOWN (title, code, _id only) ──────────────────────────────
export const getOfferDropdown = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const offers = await offerService.getOfferDropdown(organizationId);

    res.status(200).json({ ok: true, data: offers });
  } catch (error) {
    next(error);
  }
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getOfferById = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, offerId } = req.params;

    if (!organizationId || !offerId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Offer ID are required' });
      return;
    }

    const offer = await offerService.getOfferById(organizationId, offerId);

    res.status(200).json({ ok: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateOffer = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, offerId } = req.params;
    const userId = req.user!.userId;
    const {
      title,
      code,
      discountType,
      discountValue,
      applicableOn,
      categoryIds,
      menuItemIds,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      perCustomerLimit,
    } = req.body;

    if (!organizationId || !offerId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Offer ID are required' });
      return;
    }

    const offer = await offerService.updateOffer(organizationId, offerId, userId, {
      title,
      code,
      discountType,
      discountValue,
      applicableOn,
      categoryIds,
      menuItemIds,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      perCustomerLimit,
    });

    res.status(200).json({ ok: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// ── SOFT DELETE ───────────────────────────────────────────────────
export const softDeleteOffer = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, offerId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !offerId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Offer ID are required' });
      return;
    }

    const offer = await offerService.softDeleteOffer(organizationId, offerId, userId);

    res.status(200).json({ ok: true, message: 'Offer deactivated', data: offer });
  } catch (error) {
    next(error);
  }
};

// ── RESTORE ────────────────────────────────────────────────────────
export const restoreOffer = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, offerId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !offerId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Offer ID are required' });
      return;
    }

    const offer = await offerService.restoreOffer(organizationId, offerId, userId);

    res.status(200).json({ ok: true, message: 'Offer restored', data: offer });
  } catch (error) {
    next(error);
  }
};

// ── HARD DELETE ───────────────────────────────────────────────────
export const hardDeleteOffer = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, offerId } = req.params;

    if (!organizationId || !offerId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Offer ID are required' });
      return;
    }

    await offerService.hardDeleteOffer(organizationId, offerId);

    res.status(200).json({ ok: true, message: 'Offer permanently deleted' });
  } catch (error) {
    next(error);
  }
};