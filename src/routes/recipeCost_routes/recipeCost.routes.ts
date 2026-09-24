import { Router } from 'express';
import * as recipeCostController from '../../controllers/recipeCost_controllers/recipecost.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const recipeCostRoutes = Router({ mergeParams: true });

// ── COLLECTION ENDPOINTS ──────────────────────────────────────────

// GET /api/recipe-costs/v1/:organizationId (List active recipe costs)
recipeCostRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  recipeCostController.getRecipeCostList
);

// POST /api/recipe-costs/v1/:organizationId (Create a new recipe cost)
recipeCostRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'),
  recipeCostController.createRecipeCost
);

// GET /api/recipe-costs/v1/:organizationId/inactive (List inactive / soft-deleted recipe costs)
recipeCostRoutes.get(
  '/v1/:organizationId/inactive',
  multiAuthRole('owner', 'admin', 'cto'),
  recipeCostController.getInactiveRecipeCostList
);

// ── ITEM-SPECIFIC ENDPOINTS ───────────────────────────────────────

// GET /api/recipe-costs/v1/:organizationId/:recipeCostId (Get recipe cost by ID)
recipeCostRoutes.get(
  '/v1/:organizationId/:recipeCostId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  recipeCostController.getRecipeCostById
);

// PUT /api/recipe-costs/v1/:organizationId/:recipeCostId (Update recipe cost)
recipeCostRoutes.put(
  '/v1/:organizationId/:recipeCostId',
  multiAuthRole('owner', 'admin', 'cto'),
  recipeCostController.updateRecipeCost
);

// PATCH /api/recipe-costs/v1/:organizationId/:recipeCostId/restore (Restore soft-deleted recipe cost)
recipeCostRoutes.patch(
  '/v1/:organizationId/:recipeCostId/restore',
  multiAuthRole('owner', 'admin', 'cto'),
  recipeCostController.restoreRecipeCost
);

// DELETE /api/recipe-costs/v1/:organizationId/:recipeCostId (Soft delete recipe cost)
recipeCostRoutes.delete(
  '/v1/:organizationId/:recipeCostId',
  multiAuthRole('owner', 'admin', 'cto'),
  recipeCostController.softDeleteRecipeCost
);

// DELETE /api/recipe-costs/v1/:organizationId/:recipeCostId/hard (Permanent delete)
recipeCostRoutes.delete(
  '/v1/:organizationId/:recipeCostId/hard',
  multiAuthRole('owner', 'admin'),
  recipeCostController.hardDeleteRecipeCost
);

export default recipeCostRoutes;