import { Router } from "express";
// import * as menuItemController from "../../controllers/menu_controllers/menuItem.controller.js";
import * as menuItemController from "../../controllers/menu_items/menuItem.controller.js";

import { multiAuthRole } from "../../middleware/auth.middleware.js";

const menuItemRoutes = Router();

// ── DROPDOWN & FILTERED ENDPOINTS ───────────────────────────────
// GET /api/menu-item/v1/:organizationId/dropdown
menuItemRoutes.get(
  "/v1/:organizationId/:categoryId/dropdown",
  multiAuthRole("owner", "admin", "cto", "staff"),
  menuItemController.getMenuItemDropdown
);

// GET /api/menu-item/v1/:organizationId/inactive
menuItemRoutes.get(
  "/v1/:organizationId/inactive",
  multiAuthRole("owner", "admin", "cto", "staff"),
  menuItemController.getInactiveMenuItems
);

// ── COLLECTION CRUD ENDPOINTS ───────────────────────────────────
// POST /api/menu-item/v1/:organizationId (Create)
menuItemRoutes.post(
  "/v1/:organizationId",
  multiAuthRole("owner", "admin", "cto"), // Usually staff shouldn't create items, adjust as needed
  menuItemController.createMenuItem
);

// GET /api/menu-item/v1/:organizationId (Get All Active)
menuItemRoutes.get(
  "/v1/:organizationId",
  multiAuthRole("owner", "admin", "cto", "staff"),
  menuItemController.getActiveMenuItems
);

// ── ACTIONS ON SPECIFIC ITEM ────────────────────────────────────
// PATCH /api/menu-item/v1/:organizationId/:id/recover (Restore soft-deleted)
menuItemRoutes.patch(
  "/v1/:organizationId/:id/recover",
  multiAuthRole("owner", "admin", "cto"),
  menuItemController.recoverMenuItem
);

// GET /api/menu-item/v1/:organizationId/:id (Get Single by ID)
menuItemRoutes.get(
  "/v1/:organizationId/:id",
  multiAuthRole("owner", "admin", "cto", "staff"),
  menuItemController.getMenuItemById
);

// PUT /api/menu-item/v1/:organizationId/:id (Update)
menuItemRoutes.put(
  "/v1/:organizationId/:id",
  multiAuthRole("owner", "admin", "cto"),
  menuItemController.updateMenuItem
);

// PATCH /api/menu-item/v1/:organizationId/:id (Soft Delete)
menuItemRoutes.patch(
  "/v1/:organizationId/:id",
  multiAuthRole("owner", "admin", "cto"),
  menuItemController.softDeleteMenuItem
);

// DELETE /api/menu-item/v1/:organizationId/:id (Permanent Hard Delete)
menuItemRoutes.delete(
  "/v1/:organizationId/:id",
  multiAuthRole("owner", "admin", "cto"),
  menuItemController.hardDeleteMenuItem
);

export default menuItemRoutes;