import { Router } from 'express';
import * as outletController from '../../controllers/outlet_controllers/outlet.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const outletRoutes = Router({ mergeParams: true });

// ── DROPDOWN & FILTERED ENDPOINTS ───────────────────────────────

// GET /api/outlets/v1/:organizationId/dropdown
outletRoutes.get(
  '/v1/:organizationId/dropdown',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  outletController.getOutletDropdown
);

// GET /api/outlets/v1/:organizationId/inactive
outletRoutes.get(
  '/v1/:organizationId/inactive',
  multiAuthRole('owner', 'admin', 'cto'), // Staff usually don't need to see inactive structural entities
  outletController.getInactiveOutletList
);

// ── COLLECTION CRUD ENDPOINTS ───────────────────────────────────

// GET /api/outlets/v1/:organizationId
outletRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  outletController.getOutletList
);

// POST /api/outlets/v1/:organizationId
outletRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'),
  outletController.createOutlet
);

// ── SINGLE ENTITY CRUD ENDPOINTS ────────────────────────────────

// GET /api/outlets/v1/:organizationId/:outletId
outletRoutes.get(
  '/v1/:organizationId/:outletId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  outletController.getOutletById
);

// PATCH /api/outlets/v1/:organizationId/:outletId
outletRoutes.patch(
  '/v1/:organizationId/:outletId',
  multiAuthRole('owner', 'admin', 'cto'),
  outletController.updateOutlet
);

// ── LIFECYCLE & DELETION ENDPOINTS ──────────────────────────────

// PATCH /api/outlets/v1/:organizationId/:outletId/deactivate (Soft Delete)
outletRoutes.patch(
  '/v1/:organizationId/:outletId/deactivate',
  multiAuthRole('owner', 'admin', 'cto'),
  outletController.softDeleteOutlet
);

// PATCH /api/outlets/v1/:organizationId/:outletId/restore (Restore)
outletRoutes.patch(
  '/v1/:organizationId/:outletId/restore',
  multiAuthRole('owner', 'admin', 'cto'),
  outletController.restoreOutlet
);

// DELETE /api/outlets/v1/:organizationId/:outletId (Hard Delete)
outletRoutes.delete(
  '/v1/:organizationId/:outletId',
  multiAuthRole('owner', 'cto'), // Highly destructive: restricted to owner/CTO
  outletController.hardDeleteOutlet
);

export default outletRoutes;