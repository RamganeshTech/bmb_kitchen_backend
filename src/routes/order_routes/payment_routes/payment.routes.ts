import { Router } from 'express';
import * as paymentController from '../../../controllers/payments_controller/payment.controller.js';
import { multiAuthRole } from '../../../middleware/auth.middleware.js';

const paymentRoutes = Router({ mergeParams: true });

// ── PAYMENT LOGS & RECEIPT ENDPOINTS ────────────────────────────

// GET /api/payments/v1/:organizationId
// List/filter payments with pagination, date range, payment methods, and outlet scope
paymentRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  paymentController.listPayments
);

// GET /api/payments/v1/:organizationId/:id
// Get full transaction/receipt details by order/payment ID
paymentRoutes.get(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  paymentController.getPaymentById
);

export default paymentRoutes;