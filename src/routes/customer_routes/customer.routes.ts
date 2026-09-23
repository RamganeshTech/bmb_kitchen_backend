import { Router } from 'express';
import * as customerController from '../../controllers/customer_controllers/customer.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const customerRoutes = Router({ mergeParams: true });

// ── DROPDOWN & FILTERED ENDPOINTS ───────────────────────────────
// GET /api/customer/v1/:organizationId/dropdown
customerRoutes.get(
  '/v1/:organizationId/dropdown',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  customerController.getCustomerDropdown
);

// GET /api/customer/v1/:organizationId/inactive
customerRoutes.get(
  '/v1/:organizationId/inactive',
  multiAuthRole('owner', 'admin', 'cto'),
  customerController.getInactiveCustomers
);

// ── COLLECTION ENDPOINTS ──────────────────────────────────────────
// POST /api/customer/v1/:organizationId
customerRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  customerController.createCustomer
);

// GET /api/customer/v1/:organizationId
customerRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  customerController.getActiveCustomers
);

// ── SINGLE ITEM ENDPOINTS ─────────────────────────────────────────
// GET /api/customer/v1/:organizationId/:id
customerRoutes.get(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  customerController.getCustomerById
);

// PUT /api/customer/v1/:organizationId/:id
customerRoutes.put(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  customerController.updateCustomer
);

// PATCH /api/customer/v1/:organizationId/:id/recover
customerRoutes.patch(
  '/v1/:organizationId/:id/recover',
  multiAuthRole('owner', 'admin', 'cto'),
  customerController.recoverCustomer
);

// PATCH /api/customer/v1/:organizationId/:id (Soft Delete)
customerRoutes.patch(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto'),
  customerController.softDeleteCustomer
);

// DELETE /api/customer/v1/:organizationId/:id (Hard Delete)
customerRoutes.delete(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto'),
  customerController.hardDeleteCustomer
);

export default customerRoutes;