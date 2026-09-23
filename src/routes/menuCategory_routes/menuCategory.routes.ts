import { Router } from "express";
import * as menuCategoryController from "../../controllers/menu_category/menuCategory.controller.js";
import { multiAuthRole } from "../../middleware/auth.middleware.js";

const menuCategoryRoutes = Router();

// ── DROPDOWN & FILTERED ENDPOINTS ───────────────────────────────
// GET /api/menu-category/v1/:organizationId/dropdown
menuCategoryRoutes.get(
  "/v1/:organizationId/dropdown",
  multiAuthRole("owner", "admin", "cto", "staff"),
  menuCategoryController.getMenuCategoryDropdown
);

// GET /api/menu-category/v1/:organizationId/inactive
menuCategoryRoutes.get(
  "/v1/:organizationId/inactive",
  multiAuthRole("owner", "admin", "cto", "staff"),
  menuCategoryController.getInactiveMenuCategories
);

// ── COLLECTION CRUD ENDPOINTS ───────────────────────────────────
// POST /api/menu-category/v1/:organizationId (Create)
menuCategoryRoutes.post(
  "/v1/:organizationId",
  multiAuthRole("owner", "admin", "cto", "staff"),
  menuCategoryController.createMenuCategory
);

// GET /api/menu-category/v1/:organizationId (Get All Active)
menuCategoryRoutes.get(
  "/v1/:organizationId",
  multiAuthRole("owner", "admin", "cto", "staff"),
  menuCategoryController.getActiveMenuCategories
);

// ── ACTIONS ON SPECIFIC CATEGORY ────────────────────────────────
// PATCH /api/menu-category/v1/:organizationId/:id/recover (Restore soft-deleted)
menuCategoryRoutes.patch(
  "/v1/:organizationId/:id/recover",
  multiAuthRole("owner", "admin", "cto", "staff"),
  menuCategoryController.recoverMenuCategory
);

// GET /api/menu-category/v1/:organizationId/:id (Get Single by ID)
menuCategoryRoutes.get(
  "/v1/:organizationId/:id",
  multiAuthRole("owner", "admin", "cto", "staff"),
  menuCategoryController.getMenuCategoryById
);

// PUT /api/menu-category/v1/:organizationId/:id (Update)
menuCategoryRoutes.put(
  "/v1/:organizationId/:id",
  multiAuthRole("owner", "admin", "cto", "staff"),
  menuCategoryController.updateMenuCategory
);

// PATCH /api/menu-category/v1/:organizationId/:id (Soft Delete)
menuCategoryRoutes.patch(
  "/v1/:organizationId/:id",
  multiAuthRole("owner", "admin", "cto", "staff"),
  menuCategoryController.softDeleteMenuCategory
);

// DELETE /api/menu-category/v1/:organizationId/:id (Permanent Hard Delete)
menuCategoryRoutes.delete(
  "/v1/:organizationId/:id",
  multiAuthRole("owner", "admin", "cto", "staff"),
  menuCategoryController.hardDeleteMenuCategory
);

export default menuCategoryRoutes;