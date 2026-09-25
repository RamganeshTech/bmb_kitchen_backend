import { Router } from 'express';
import * as supportTicketController from "../../controllers/supportTicket_controllers/supportTicket.controller.js";
import { multiAuthRole } from "../../middleware/auth.middleware.js";

const supportTicketRoutes = Router({ mergeParams: true });

// ── CREATE ──────────────────────────────────────────────────────────

// POST /api/support-ticket/v1/:organizationId
supportTicketRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'), // any staff can raise a ticket
  supportTicketController.createTicket
);

// ── LIST ──────────────────────────────────────────────────────────────

// GET /api/support-ticket/v1/:organizationId?outletId=&status=&category=&priority=
supportTicketRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  supportTicketController.listActiveTickets
);

// GET /api/support-ticket/v1/:organizationId/inactive
supportTicketRoutes.get(
  '/v1/:organizationId/inactive',
  multiAuthRole('owner', 'admin', 'cto'),
  supportTicketController.listInactiveTickets
);

// ── GET BY ID ───────────────────────────────────────────────────────

// GET /api/support-ticket/v1/:organizationId/:id
supportTicketRoutes.get(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  supportTicketController.getTicket
);

// ── ADVANCE STATUS (Open → In progress → Closed → Open) ─────────────

// PATCH /api/support-ticket/v1/:organizationId/:id/advance
supportTicketRoutes.patch(
  '/v1/:organizationId/:id/advance',
  multiAuthRole('owner', 'admin', 'cto'), // matches the HTML — cycleTicket has no visible staff restriction, but progressing/closing support issues fits management
  supportTicketController.advanceTicketStatus
);

// ── SOFT DELETE / RESTORE / HARD DELETE ──────────────────────────────

// PATCH /api/support-ticket/v1/:organizationId/:id/deactivate
supportTicketRoutes.patch(
  '/v1/:organizationId/:id/deactivate',
  multiAuthRole('owner', 'admin', 'cto'),
  supportTicketController.softDeleteTicket
);

// PATCH /api/support-ticket/v1/:organizationId/:id/restore
supportTicketRoutes.patch(
  '/v1/:organizationId/:id/restore',
  multiAuthRole('owner', 'admin', 'cto'),
  supportTicketController.restoreTicket
);

// DELETE /api/support-ticket/v1/:organizationId/:id
supportTicketRoutes.delete(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto'),
  supportTicketController.hardDeleteTicket
);

export default supportTicketRoutes;