import { Router } from 'express';
import * as inventoryController from '../../controllers/inventory_controllers/inventory.controller.js';

import { multiAuthRole } from '../../middleware/auth.middleware.js';

const inventoryRoutes = Router({ mergeParams: true });

// ── COLLECTION ENDPOINTS ──────────────────────────────────────────

// GET /api/inventory/v1/:organizationId (List active inventory items)
inventoryRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  inventoryController.getInventoryList
);

// POST /api/inventory/v1/:organizationId (Create a new inventory item)
inventoryRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'),
  inventoryController.createInventory
);

// GET /api/inventory/v1/:organizationId/dropdown (Minimal fields for selectors/dropdowns)
inventoryRoutes.get(
  '/v1/:organizationId/dropdown',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  inventoryController.getInventoryDropdown
);

// GET /api/inventory/v1/:organizationId/inactive (List soft-deleted items)
inventoryRoutes.get(
  '/v1/:organizationId/inactive',
  multiAuthRole('owner', 'admin', 'cto'),
  inventoryController.getInactiveInventoryList
);

// ── ITEM-SPECIFIC ENDPOINTS ───────────────────────────────────────

// GET /api/inventory/v1/:organizationId/:inventoryId (Get single item details)
inventoryRoutes.get(
  '/v1/:organizationId/:inventoryId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  inventoryController.getInventoryById
);

// PUT /api/inventory/v1/:organizationId/:inventoryId (Update item details)
inventoryRoutes.put(
  '/v1/:organizationId/:inventoryId',
  multiAuthRole('owner', 'admin', 'cto'),
  inventoryController.updateInventory
);

// POST /api/inventory/v1/:organizationId/:inventoryId/adjust (Stock in / Stock out adjustment)
inventoryRoutes.post(
  '/v1/:organizationId/:inventoryId/adjust',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  inventoryController.adjustInventoryStock
);

// PATCH /api/inventory/v1/:organizationId/:inventoryId/restore (Reactivate soft-deleted item)
inventoryRoutes.patch(
  '/v1/:organizationId/:inventoryId/restore',
  multiAuthRole('owner', 'admin', 'cto'),
  inventoryController.restoreInventory
);

// DELETE /api/inventory/v1/:organizationId/:inventoryId (Soft delete item)
inventoryRoutes.delete(
  '/v1/:organizationId/:inventoryId',
  multiAuthRole('owner', 'admin', 'cto'),
  inventoryController.softDeleteInventory
);

// DELETE /api/inventory/v1/:organizationId/:inventoryId/hard (Permanent delete)
inventoryRoutes.delete(
  '/v1/:organizationId/:inventoryId/hard',
  multiAuthRole('owner', 'admin'),
  inventoryController.hardDeleteInventory
);

export default inventoryRoutes;