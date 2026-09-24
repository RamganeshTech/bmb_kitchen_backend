import { Router } from 'express';
import * as loyaltyProgramController from '../../controllers/loyaltyProgram_controllers/loyaltyProgram.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const loyaltyProgramRoutes = Router({ mergeParams: true });

// ── CONFIGURATION ENDPOINTS (Singleton per Organization) ──────────

// GET /api/loyalty-program/v1/:organizationId (View rules)
loyaltyProgramRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'), // Staff needs to view this to explain rules to customers
  loyaltyProgramController.getLoyaltyProgram
);

// POST /api/loyalty-program/v1/:organizationId (Initial Setup)
loyaltyProgramRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'), // Setup is strictly for management
  loyaltyProgramController.createLoyaltyProgram
);

// PATCH /api/loyalty-program/v1/:organizationId (Update rules/tiers)
loyaltyProgramRoutes.patch(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'), // Updating points/values is strictly for management
  loyaltyProgramController.updateLoyaltyProgram
);

export default loyaltyProgramRoutes;