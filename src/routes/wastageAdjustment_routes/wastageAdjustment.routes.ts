import { Router } from 'express';
import * as wastageAdjustmentController from '../../controllers/wastageAdjustment_controllers/wastageAdjustment.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const wastageAdjustmentRoutes = Router({ mergeParams: true });

// ── COLLECTION ENDPOINTS ──────────────────────────────────────────

// GET /api/wastage-adjustments/v1/:organizationId (List active wastage/adjustments)
wastageAdjustmentRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  wastageAdjustmentController.getWastageAdjustmentList
);

// POST /api/wastage-adjustments/v1/:organizationId (Log a new wastage or adjustment)
wastageAdjustmentRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  wastageAdjustmentController.createWastageAdjustment
);

// GET /api/wastage-adjustments/v1/:organizationId/inactive (List inactive / soft-deleted records)
wastageAdjustmentRoutes.get(
  '/v1/:organizationId/inactive',
  multiAuthRole('owner', 'admin', 'cto'),
  wastageAdjustmentController.getInactiveWastageAdjustmentList
);

// ── ITEM-SPECIFIC ENDPOINTS ───────────────────────────────────────

// GET /api/wastage-adjustments/v1/:organizationId/:wastageAdjustmentId (Get by ID)
wastageAdjustmentRoutes.get(
  '/v1/:organizationId/:wastageAdjustmentId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  wastageAdjustmentController.getWastageAdjustmentById
);

// PUT /api/wastage-adjustments/v1/:organizationId/:wastageAdjustmentId (Update reason/type)
wastageAdjustmentRoutes.put(
  '/v1/:organizationId/:wastageAdjustmentId',
  multiAuthRole('owner', 'admin', 'cto'),
  wastageAdjustmentController.updateWastageAdjustment
);

// PATCH /api/wastage-adjustments/v1/:organizationId/:wastageAdjustmentId/restore (Reactivate)
wastageAdjustmentRoutes.patch(
  '/v1/:organizationId/:wastageAdjustmentId/restore',
  multiAuthRole('owner', 'admin', 'cto'),
  wastageAdjustmentController.restoreWastageAdjustment
);

// DELETE /api/wastage-adjustments/v1/:organizationId/:wastageAdjustmentId (Soft delete)
wastageAdjustmentRoutes.delete(
  '/v1/:organizationId/:wastageAdjustmentId',
  multiAuthRole('owner', 'admin', 'cto'),
  wastageAdjustmentController.softDeleteWastageAdjustment
);

// DELETE /api/wastage-adjustments/v1/:organizationId/:wastageAdjustmentId/hard (Permanent delete)
wastageAdjustmentRoutes.delete(
  '/v1/:organizationId/:wastageAdjustmentId/hard',
  multiAuthRole('owner', 'admin'),
  wastageAdjustmentController.hardDeleteWastageAdjustment
);

export default wastageAdjustmentRoutes;