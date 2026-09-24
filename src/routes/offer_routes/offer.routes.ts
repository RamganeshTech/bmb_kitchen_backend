import { Router } from 'express';
import * as offerController from '../../controllers/offer_controllers/offer.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const offerRoutes = Router({ mergeParams: true });

// ── DROPDOWN & FILTERED ENDPOINTS ───────────────────────────────

// GET /api/offers/v1/:organizationId/dropdown
offerRoutes.get(
  '/v1/:organizationId/dropdown',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  offerController.getOfferDropdown
);

// GET /api/offers/v1/:organizationId/inactive
offerRoutes.get(
  '/v1/:organizationId/inactive',
  multiAuthRole('owner', 'admin', 'cto'), // Staff usually don't need to see inactive/expired offers in the management view
  offerController.getInactiveOfferList
);

// ── COLLECTION CRUD ENDPOINTS ───────────────────────────────────

// GET /api/offers/v1/:organizationId
offerRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'), // Staff needs this to see active offers on the POS
  offerController.getOfferList
);

// POST /api/offers/v1/:organizationId
offerRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'),
  offerController.createOffer
);

// ── SINGLE ENTITY CRUD ENDPOINTS ────────────────────────────────

// GET /api/offers/v1/:organizationId/:offerId
offerRoutes.get(
  '/v1/:organizationId/:offerId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  offerController.getOfferById
);

// PATCH /api/offers/v1/:organizationId/:offerId
offerRoutes.patch(
  '/v1/:organizationId/:offerId',
  multiAuthRole('owner', 'admin', 'cto'),
  offerController.updateOffer
);

// ── LIFECYCLE & DELETION ENDPOINTS ──────────────────────────────

// PATCH /api/offers/v1/:organizationId/:offerId/deactivate (Soft Delete / Expire)
offerRoutes.patch(
  '/v1/:organizationId/:offerId/deactivate',
  multiAuthRole('owner', 'admin', 'cto'),
  offerController.softDeleteOffer
);

// PATCH /api/offers/v1/:organizationId/:offerId/restore (Restore / Reactivate)
offerRoutes.patch(
  '/v1/:organizationId/:offerId/restore',
  multiAuthRole('owner', 'admin', 'cto'),
  offerController.restoreOffer
);

// DELETE /api/offers/v1/:organizationId/:offerId (Hard Delete)
offerRoutes.delete(
  '/v1/:organizationId/:offerId',
  multiAuthRole('owner', 'cto'), // Highly destructive: restricted strictly to owner/CTO
  offerController.hardDeleteOffer
);

export default offerRoutes;