import { Router } from 'express';
// import * as roleController from './role.controller.js';
import * as roleController from "../../../controllers/user_controllers/role_controllers/role.controller.js";
import { multiAuthRole } from '../../../middleware/auth.middleware.js';


const roleRoutes = Router({ mergeParams: true });

// ── CREATE ──────────────────────────────────────────────────────────

// POST /api/role/v1/:organizationId
roleRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'), // defining who-can-access-what is management-only
  roleController.createRole
);

// ── LIST ──────────────────────────────────────────────────────────────

// GET /api/role/v1/:organizationId
roleRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'),
  roleController.listActiveRoles
);

// GET /api/role/v1/:organizationId/inactive
roleRoutes.get(
  '/v1/:organizationId/inactive',
  multiAuthRole('owner', 'admin', 'cto'),
  roleController.listInactiveRoles
);

// GET /api/role/v1/:organizationId/dropdown
roleRoutes.get(
  '/v1/:organizationId/dropdown',
  multiAuthRole('owner', 'admin', 'cto'), // used to populate the "Role" select when adding staff
  roleController.listRolesDropdown
);

// ── GET BY ID ───────────────────────────────────────────────────────

// GET /api/role/v1/:organizationId/:id
roleRoutes.get(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto'),
  roleController.getRole
);

// ── UPDATE ──────────────────────────────────────────────────────────

// PATCH /api/role/v1/:organizationId/:id
roleRoutes.patch(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto'),
  roleController.updateRole
);

// ── SOFT DELETE / RESTORE / HARD DELETE ──────────────────────────────

// PATCH /api/role/v1/:organizationId/:id/deactivate
roleRoutes.patch(
  '/v1/:organizationId/:id/deactivate',
  multiAuthRole('owner', 'admin', 'cto'),
  roleController.softDeleteRole
);

// PATCH /api/role/v1/:organizationId/:id/restore
roleRoutes.patch(
  '/v1/:organizationId/:id/restore',
  multiAuthRole('owner', 'admin', 'cto'),
  roleController.restoreRole
);

// DELETE /api/role/v1/:organizationId/:id
roleRoutes.delete(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto'),
  roleController.hardDeleteRole
);

export default roleRoutes;