import { Router } from 'express';
import * as taxSettingsController from '../../controllers/taxSetting_controllers/taxSetting.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const taxSettingsRoutes = Router({ mergeParams: true });

// ── ROOT CONFIGURATION ENDPOINTS (Singleton per Organization) ────

// GET /api/tax-settings/v1/:organizationId
// Needed by staff/POS to calculate taxes during billing
taxSettingsRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  taxSettingsController.getTaxSettings
);

// POST /api/tax-settings/v1/:organizationId
// Initial tax configuration setup
taxSettingsRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'),
  taxSettingsController.createTaxSettings
);

// PATCH /api/tax-settings/v1/:organizationId
// Update mode, service charge, and dine-in toggles
taxSettingsRoutes.patch(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'),
  taxSettingsController.updateTaxSettings
);

// ── TAX RATES SUB-RESOURCE ENDPOINTS ─────────────────────────────

// POST /api/tax-settings/v1/:organizationId/rates
// Add a new tax bracket/rate (e.g., GST 5%, GST 18%)
taxSettingsRoutes.post(
  '/v1/:organizationId/rates',
  multiAuthRole('owner', 'admin', 'cto'),
  taxSettingsController.addTaxRate
);

// PATCH /api/tax-settings/v1/:organizationId/rates/:rateId/default
// Set a specific tax rate as default
taxSettingsRoutes.patch(
  '/v1/:organizationId/rates/:rateId/default',
  multiAuthRole('owner', 'admin', 'cto'),
  taxSettingsController.setDefaultTaxRate
);

export default taxSettingsRoutes;