import { Router } from 'express';
import * as centralKitchenController from '../../controllers/centralKitchen_controllers/centralKitchen.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const centralKitchenRoutes = Router({ mergeParams: true });

// ── FILTERED ENDPOINTS ──────────────────────────────────────────

// GET /api/central-kitchen/v1/:organizationId/inactive
// Must come before /:id to prevent "inactive" from matching as an ID parameter
centralKitchenRoutes.get(
  '/v1/:organizationId/inactive',
  multiAuthRole('owner', 'admin', 'cto'),
  centralKitchenController.listInactiveTransfers
);

// ── COLLECTION CRUD ENDPOINTS ───────────────────────────────────

// GET /api/central-kitchen/v1/:organizationId
centralKitchenRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  centralKitchenController.listActiveTransfers
);

// POST /api/central-kitchen/v1/:organizationId
centralKitchenRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'), // Kitchen/store staff can initiate transfers
  centralKitchenController.createTransfer
);

// ── SINGLE ENTITY & STAGE TRANSITIONS ───────────────────────────

// GET /api/central-kitchen/v1/:organizationId/:id
centralKitchenRoutes.get(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  centralKitchenController.getTransfer
);

// PATCH /api/central-kitchen/v1/:organizationId/:id/stage
// Update transit state: e.g., dispatched, in-transit, received, cancelled
centralKitchenRoutes.patch(
  '/v1/:organizationId/:id/stage',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  centralKitchenController.updateTransferStage
);

// ── LIFECYCLE & DELETION ENDPOINTS ──────────────────────────────

// PATCH /api/central-kitchen/v1/:organizationId/:id/deactivate (Soft Delete)
centralKitchenRoutes.patch(
  '/v1/:organizationId/:id/deactivate',
  multiAuthRole('owner', 'admin', 'cto'),
  centralKitchenController.softDeleteTransfer
);

// PATCH /api/central-kitchen/v1/:organizationId/:id/restore (Restore)
centralKitchenRoutes.patch(
  '/v1/:organizationId/:id/restore',
  multiAuthRole('owner', 'admin', 'cto'),
  centralKitchenController.restoreTransfer
);

// DELETE /api/central-kitchen/v1/:organizationId/:id (Hard Delete)
centralKitchenRoutes.delete(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'cto'), // Restricted strictly to owner/CTO
  centralKitchenController.hardDeleteTransfer
);

export default centralKitchenRoutes;