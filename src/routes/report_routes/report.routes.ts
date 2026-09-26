import { Router } from 'express';
import * as reportController from '../../controllers/report_controllers/report.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const reportRoutes = Router({ mergeParams: true });

// All query params (outletId, scope=today|week|month|year|custom, from, to) are optional filters

// GET /api/report/v1/:organizationId/sales
reportRoutes.get(
  '/v1/:organizationId/sales',
  multiAuthRole('owner', 'admin', 'cto'),
  reportController.getSalesReport
);

// GET /api/report/v1/:organizationId/items
reportRoutes.get(
  '/v1/:organizationId/items',
  multiAuthRole('owner', 'admin', 'cto'),
  reportController.getItemSalesReport
);

// GET /api/report/v1/:organizationId/expenses
reportRoutes.get(
  '/v1/:organizationId/expenses',
  multiAuthRole('owner', 'admin', 'cto'),
  reportController.getExpenseReport
);

// GET /api/report/v1/:organizationId/payments-summary
reportRoutes.get(
  '/v1/:organizationId/payments-summary',
  multiAuthRole('owner', 'admin', 'cto'),
  reportController.getPaymentModeReport
);

// GET /api/report/v1/:organizationId/gst-summary
reportRoutes.get(
  '/v1/:organizationId/gst-summary',
  multiAuthRole('owner', 'admin', 'cto'),
  reportController.getGstSummary
);

export default reportRoutes;