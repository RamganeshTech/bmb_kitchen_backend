import { Router } from 'express';
import * as subscriptionController from '../../controllers/subscription_controller/subscription.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const subscriptionRoutes = Router({ mergeParams: true });

// ── CONFIGURATION ENDPOINTS (Singleton per Organization) ──────────

// GET /api/subscription/v1/:organizationId (View current plan & renewal)
subscriptionRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'), // billing info — not a staff-facing screen like Loyalty
  subscriptionController.getSubscription
);

// POST /api/subscription/v1/:organizationId (Initial Setup)
subscriptionRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'), // setup is strictly for management
  subscriptionController.createSubscription
);

// ── PLAN CHANGE ─────────────────────────────────────────────────────

// PATCH /api/subscription/v1/:organizationId/plan
subscriptionRoutes.patch(
  '/v1/:organizationId/plan',
  multiAuthRole('owner', 'admin', 'cto'), // matches HTML's changePlan — manager-PIN-gated client-side
  subscriptionController.changePlan
);

// ── INVOICES ─────────────────────────────────────────────────────────

// POST /api/subscription/v1/:organizationId/invoices
subscriptionRoutes.post(
  '/v1/:organizationId/invoices',
  multiAuthRole('owner', 'admin', 'cto'), // recording a billing invoice — management only
  subscriptionController.addInvoice
);

// GET /api/subscription/v1/:organizationId/invoices
subscriptionRoutes.get(
  '/v1/:organizationId/invoices',
  multiAuthRole('owner', 'admin', 'cto'), // billing history — management only, unlike loyalty which staff can view
  subscriptionController.listInvoices
);

export default subscriptionRoutes;