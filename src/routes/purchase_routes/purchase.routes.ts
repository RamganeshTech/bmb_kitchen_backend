import { Router } from 'express';
import * as purchaseController from '../../controllers/purchase_controllers/purchase.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const purchaseRoutes = Router({ mergeParams: true });

// ── COLLECTION ENDPOINTS ──────────────────────────────────────────

// GET /api/purchases/v1/:organizationId (List active purchases)
purchaseRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  purchaseController.getPurchaseList
);

// POST /api/purchases/v1/:organizationId (Create a new purchase)
purchaseRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'),
  purchaseController.createPurchase
);

// GET /api/purchases/v1/:organizationId/inactive (List inactive / soft-deleted purchases)
purchaseRoutes.get(
  '/v1/:organizationId/inactive',
  multiAuthRole('owner', 'admin', 'cto'),
  purchaseController.getInactivePurchaseList
);

// ── ITEM-SPECIFIC ENDPOINTS ───────────────────────────────────────

// GET /api/purchases/v1/:organizationId/:purchaseId (Get purchase by ID)
purchaseRoutes.get(
  '/v1/:organizationId/:purchaseId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  purchaseController.getPurchaseById
);

// PUT /api/purchases/v1/:organizationId/:purchaseId (Update purchase)
purchaseRoutes.put(
  '/v1/:organizationId/:purchaseId',
  multiAuthRole('owner', 'admin', 'cto'),
  purchaseController.updatePurchase
);

// PATCH /api/purchases/v1/:organizationId/:purchaseId/restore (Restore soft-deleted purchase)
purchaseRoutes.patch(
  '/v1/:organizationId/:purchaseId/restore',
  multiAuthRole('owner', 'admin', 'cto'),
  purchaseController.restorePurchase
);

// DELETE /api/purchases/v1/:organizationId/:purchaseId (Soft delete purchase)
purchaseRoutes.delete(
  '/v1/:organizationId/:purchaseId',
  multiAuthRole('owner', 'admin', 'cto'),
  purchaseController.softDeletePurchase
);

// DELETE /api/purchases/v1/:organizationId/:purchaseId/hard (Permanent delete)
purchaseRoutes.delete(
  '/v1/:organizationId/:purchaseId/hard',
  multiAuthRole('owner', 'admin'),
  purchaseController.hardDeletePurchase
);

export default purchaseRoutes;