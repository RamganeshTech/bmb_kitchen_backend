import { Router } from 'express';
import * as dayClosingController from '../../controllers/dayClosing_controllers/dayClosing.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const dayClosingRoutes = Router({ mergeParams: true });

// ── LIVE SNAPSHOT (pulled from Orders + Expenses) ──────────────────

// GET /api/day-closing/v1/:organizationId/:outletId/summary?date=YYYY-MM-DD
dayClosingRoutes.get(
  '/v1/:organizationId/:outletId/summary',
  multiAuthRole('owner', 'admin', 'cto', 'staff'), // staff counts the drawer, needs to see this before submitting
  dayClosingController.getDaySummary
);

// ── SUBMIT CLOSING ──────────────────────────────────────────────────

// POST /api/day-closing/v1/:organizationId
dayClosingRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'), // matches HTML's "Closed by" staff dropdown
  dayClosingController.createDayClosing
);

// ── VIEW A SPECIFIC CLOSING ──────────────────────────────────────────

// GET /api/day-closing/v1/:organizationId/:outletId/:date
dayClosingRoutes.get(
  '/v1/:organizationId/:outletId/:date',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  dayClosingController.getClosingByDate
);

// ── CLOSING HISTORY ─────────────────────────────────────────────────

// GET /api/day-closing/v1/:organizationId/:outletId?limit=10
dayClosingRoutes.get(
  '/v1/:organizationId/:outletId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  dayClosingController.listClosingHistory
);

// ── REOPEN DAY (manager approval only) ───────────────────────────────

// PATCH /api/day-closing/v1/:organizationId/:id/reopen
dayClosingRoutes.patch(
  '/v1/:organizationId/:id/reopen',
  multiAuthRole('owner', 'admin', 'cto'), // matches HTML's "Reopen day (manager PIN)" — staff excluded
  dayClosingController.reopenDayClosing
);

export default dayClosingRoutes;