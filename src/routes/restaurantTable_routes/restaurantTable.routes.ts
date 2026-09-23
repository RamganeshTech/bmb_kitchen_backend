// src/routes/table_routes/restaurantTable.routes.ts
import { Router } from "express";
import * as tableController from "../../controllers/restaurantTable_controllers/restaurantTable.controller.js";
import { multiAuthRole } from "../../middleware/auth.middleware.js";

const restaurantTableRoutes = Router();

// ── DROPDOWN & FILTERED ENDPOINTS ───────────────────────────────
// GET /api/table/v1/:organizationId/dropdown
restaurantTableRoutes.get(
  "/v1/:organizationId/dropdown",
  multiAuthRole("owner", "admin", "cto", "staff"),
  tableController.getTableDropdown
);

// GET /api/table/v1/:organizationId/inactive
restaurantTableRoutes.get(
  "/v1/:organizationId/inactive",
  multiAuthRole("owner", "admin", "cto", "staff"),
  tableController.getInactiveTables
);

// ── COLLECTION CRUD ENDPOINTS ───────────────────────────────────
// POST /api/table/v1/:organizationId (Create)
restaurantTableRoutes.post(
  "/v1/:organizationId",
  multiAuthRole("owner", "admin", "cto"),
  tableController.createTable
);

// GET /api/table/v1/:organizationId (Get All Active)
restaurantTableRoutes.get(
  "/v1/:organizationId",
  multiAuthRole("owner", "admin", "cto", "staff"),
  tableController.getActiveTables
);

// ── TABLE SPECIFIC OPERATIONS (STATUS & RESERVATION) ────────────
// PATCH /api/table/v1/:organizationId/:id/status (Update Available/Occupied)
restaurantTableRoutes.patch(
  "/v1/:organizationId/:id/status",
  multiAuthRole("owner", "admin", "cto", "staff"),
  tableController.updateTableStatus
);

// PATCH /api/table/v1/:organizationId/:id/reserve (Add Reservation details)
restaurantTableRoutes.patch(
  "/v1/:organizationId/:id/reserve",
  multiAuthRole("owner", "admin", "cto", "staff"),
  tableController.reserveTable
);

// ── ACTIONS ON SPECIFIC TABLE ───────────────────────────────────
// PATCH /api/table/v1/:organizationId/:id/recover (Restore soft-deleted)
restaurantTableRoutes.patch(
  "/v1/:organizationId/:id/recover",
  multiAuthRole("owner", "admin", "cto"),
  tableController.recoverTable
);

// GET /api/table/v1/:organizationId/:id (Get Single by ID)
restaurantTableRoutes.get(
  "/v1/:organizationId/:id",
  multiAuthRole("owner", "admin", "cto", "staff"),
  tableController.getTableById
);

// PUT /api/table/v1/:organizationId/:id (Update Details like Name/Capacity)
restaurantTableRoutes.put(
  "/v1/:organizationId/:id",
  multiAuthRole("owner", "admin", "cto"),
  tableController.updateTableDetails
);

// PATCH /api/table/v1/:organizationId/:id (Soft Delete)
restaurantTableRoutes.patch(
  "/v1/:organizationId/:id",
  multiAuthRole("owner", "admin", "cto"),
  tableController.softDeleteTable
);

// DELETE /api/table/v1/:organizationId/:id (Permanent Hard Delete)
restaurantTableRoutes.delete(
  "/v1/:organizationId/:id",
  multiAuthRole("owner", "admin", "cto"),
  tableController.hardDeleteTable
);

export default restaurantTableRoutes;