import { Router } from 'express';
import * as vendorController from '../../controllers/vendor_controllers/vendor.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const vendorRoutes = Router({ mergeParams: true });

// ── COLLECTION ENDPOINTS ──────────────────────────────────────────

// GET /api/vendors/v1/:organizationId (List active vendors)
vendorRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  vendorController.getVendorList
);

// POST /api/vendors/v1/:organizationId (Create a new vendor)
vendorRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'),
  vendorController.createVendor
);

// GET /api/vendors/v1/:organizationId/dropdown (Minimal fields for selectors/dropdowns)
vendorRoutes.get(
  '/v1/:organizationId/dropdown',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  vendorController.getVendorDropdown
);

// GET /api/vendors/v1/:organizationId/inactive (List soft-deleted vendors)
vendorRoutes.get(
  '/v1/:organizationId/inactive',
  multiAuthRole('owner', 'admin', 'cto'),
  vendorController.getInactiveVendorList
);

// ── ITEM-SPECIFIC ENDPOINTS ───────────────────────────────────────

// GET /api/vendors/v1/:organizationId/:vendorId (Get vendor by ID)
vendorRoutes.get(
  '/v1/:organizationId/:vendorId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  vendorController.getVendorById
);

// PUT /api/vendors/v1/:organizationId/:vendorId (Update vendor)
vendorRoutes.put(
  '/v1/:organizationId/:vendorId',
  multiAuthRole('owner', 'admin', 'cto'),
  vendorController.updateVendor
);

// PATCH /api/vendors/v1/:organizationId/:vendorId/restore (Reactivate soft-deleted vendor)
vendorRoutes.patch(
  '/v1/:organizationId/:vendorId/restore',
  multiAuthRole('owner', 'admin', 'cto'),
  vendorController.restoreVendor
);

// DELETE /api/vendors/v1/:organizationId/:vendorId (Soft delete vendor)
vendorRoutes.delete(
  '/v1/:organizationId/:vendorId',
  multiAuthRole('owner', 'admin', 'cto'),
  vendorController.softDeleteVendor
);

// DELETE /api/vendors/v1/:organizationId/:vendorId/hard (Permanent delete)
vendorRoutes.delete(
  '/v1/:organizationId/:vendorId/hard',
  multiAuthRole('owner', 'admin'),
  vendorController.hardDeleteVendor
);

export default vendorRoutes;