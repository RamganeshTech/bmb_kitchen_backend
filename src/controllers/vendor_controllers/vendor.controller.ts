import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as vendorService from './vendor.service.js';

// ── CREATE ────────────────────────────────────────────────────────
export const createVendor = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { vendorName, contactPerson, phone, gstin, category, address, paymentTerms } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!vendorName) {
      res.status(400).json({ ok: false, message: 'Vendor name is required' });
      return;
    }

    const vendor = await vendorService.createVendor(organizationId, userId, {
      vendorName,
      contactPerson,
      phone,
      gstin,
      category,
      address,
      paymentTerms,
    });

    res.status(201).json({ ok: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getVendorList = async (
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

    const vendors = await vendorService.getVendorList(organizationId);

    res.status(200).json({ ok: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

// ── LIST (inactive / soft-deleted) ────────────────────────────────
export const getInactiveVendorList = async (
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

    const vendors = await vendorService.getInactiveVendorList(organizationId);

    res.status(200).json({ ok: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

// ── DROPDOWN (vendorName, _id only) ───────────────────────────────
export const getVendorDropdown = async (
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

    const vendors = await vendorService.getVendorDropdown(organizationId);

    res.status(200).json({ ok: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getVendorById = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, vendorId } = req.params;

    if (!organizationId || !vendorId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Vendor ID are required' });
      return;
    }

    const vendor = await vendorService.getVendorById(organizationId, vendorId);

    res.status(200).json({ ok: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateVendor = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, vendorId } = req.params;
    const userId = req.user!.userId;
    const { vendorName, contactPerson, phone, gstin, category, address, paymentTerms } = req.body;

    if (!organizationId || !vendorId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Vendor ID are required' });
      return;
    }

    const vendor = await vendorService.updateVendor(organizationId, vendorId, userId, {
      vendorName,
      contactPerson,
      phone,
      gstin,
      category,
      address,
      paymentTerms,
    });

    res.status(200).json({ ok: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// ── SOFT DELETE ───────────────────────────────────────────────────
export const softDeleteVendor = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, vendorId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !vendorId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Vendor ID are required' });
      return;
    }

    const vendor = await vendorService.softDeleteVendor(organizationId, vendorId, userId);

    res.status(200).json({ ok: true, message: 'Vendor deactivated', data: vendor });
  } catch (error) {
    next(error);
  }
};

// ── RESTORE (reactivate a soft-deleted vendor) ────────────────────
export const restoreVendor = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, vendorId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !vendorId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Vendor ID are required' });
      return;
    }

    const vendor = await vendorService.restoreVendor(organizationId, vendorId, userId);

    res.status(200).json({ ok: true, message: 'Vendor restored', data: vendor });
  } catch (error) {
    next(error);
  }
};

// ── HARD DELETE ───────────────────────────────────────────────────
export const hardDeleteVendor = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, vendorId } = req.params;

    if (!organizationId || !vendorId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Vendor ID are required' });
      return;
    }

    await vendorService.hardDeleteVendor(organizationId, vendorId);

    res.status(200).json({ ok: true, message: 'Vendor permanently deleted' });
  } catch (error) {
    next(error);
  }
};