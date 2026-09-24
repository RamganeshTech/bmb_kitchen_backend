import { Router } from 'express';
import * as expenseController from '../../controllers/expense_controllers/expense.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const expenseRoutes = Router({ mergeParams: true });

// ── FILTERED ENDPOINTS ──────────────────────────────────────────

// GET /api/expenses/v1/:organizationId/inactive
// Note: Must come BEFORE the /:expenseId route to prevent "inactive" from being read as an ID
expenseRoutes.get(
  '/v1/:organizationId/inactive',
  multiAuthRole('owner', 'admin', 'cto'), // Staff usually don't need to see deleted/inactive financial records
  expenseController.getInactiveExpenseList
);

// ── COLLECTION CRUD ENDPOINTS ───────────────────────────────────

// GET /api/expenses/v1/:organizationId
expenseRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  expenseController.getExpenseList
);

// POST /api/expenses/v1/:organizationId
expenseRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'), // Staff/cashiers often need to log daily expenses
  expenseController.createExpense
);

// ── SINGLE ENTITY CRUD ENDPOINTS ────────────────────────────────

// GET /api/expenses/v1/:organizationId/:expenseId
expenseRoutes.get(
  '/v1/:organizationId/:expenseId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  expenseController.getExpenseById
);

// PATCH /api/expenses/v1/:organizationId/:expenseId
expenseRoutes.patch(
  '/v1/:organizationId/:expenseId',
  multiAuthRole('owner', 'admin', 'cto'), // Staff shouldn't edit financial records after submitting
  expenseController.updateExpense
);

// ── LIFECYCLE & DELETION ENDPOINTS ──────────────────────────────

// PATCH /api/expenses/v1/:organizationId/:expenseId/deactivate (Soft Delete)
expenseRoutes.patch(
  '/v1/:organizationId/:expenseId/deactivate',
  multiAuthRole('owner', 'admin', 'cto'),
  expenseController.softDeleteExpense
);

// PATCH /api/expenses/v1/:organizationId/:expenseId/restore (Restore)
expenseRoutes.patch(
  '/v1/:organizationId/:expenseId/restore',
  multiAuthRole('owner', 'admin', 'cto'),
  expenseController.restoreExpense
);

// DELETE /api/expenses/v1/:organizationId/:expenseId (Hard Delete)
expenseRoutes.delete(
  '/v1/:organizationId/:expenseId',
  multiAuthRole('owner', 'cto'), // Highly destructive: restricted strictly to owner/CTO
  expenseController.hardDeleteExpense
);

export default expenseRoutes;