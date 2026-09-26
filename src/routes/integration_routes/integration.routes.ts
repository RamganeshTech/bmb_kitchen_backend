import { Router } from 'express';
import * as integrationController from '../../controllers/integration_controllers/integration.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const integrationRoutes = Router({ mergeParams: true });

// ── SEED DEFAULTS (run once per new organization) ────────────────────

// POST /api/integration/v1/:organizationId/seed
integrationRoutes.post(
  '/v1/:organizationId/seed',
  multiAuthRole('owner', 'admin', 'cto'),
  integrationController.seedDefaultIntegrations
);

// ── LIST ──────────────────────────────────────────────────────────────

// GET /api/integration/v1/:organizationId
integrationRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'),
  integrationController.listIntegrations
);

// ── GET BY ID ───────────────────────────────────────────────────────

// GET /api/integration/v1/:organizationId/:id
integrationRoutes.get(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto'),
  integrationController.getIntegration
);

// ── CONNECT / DISCONNECT ─────────────────────────────────────────────

// PATCH /api/integration/v1/:organizationId/:id/connect
integrationRoutes.patch(
  '/v1/:organizationId/:id/connect',
  multiAuthRole('owner', 'admin', 'cto'),
  integrationController.connectIntegration
);

// PATCH /api/integration/v1/:organizationId/:id/disconnect
integrationRoutes.patch(
  '/v1/:organizationId/:id/disconnect',
  multiAuthRole('owner', 'admin', 'cto'), // matches HTML's pinGate manager-approval on disconnect
  integrationController.disconnectIntegration
);

export default integrationRoutes;