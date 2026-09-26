import { Router } from 'express';
import * as dashboardController from '../../controllers/dashboard_controllers/dashboard.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';


const dashboardRoutes = Router({ mergeParams: true });

//  ALL IN 0NE CONTROLLER
// GET /api/dashboard/v1/:organizationId/:outletId/summary?date=YYYY-MM-DD
dashboardRoutes.get(
  '/v1/:organizationId/:outletId/summary',
  multiAuthRole('owner', 'admin', 'cto', 'staff'), // dashboard is the landing screen for everyone
  dashboardController.getDashboardSummary
);



// GET /api/dashboard/v1/:organizationId/:outletId/sales-kpis
dashboardRoutes.get(
  '/v1/:organizationId/:outletId/sales-kpis',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  dashboardController.getSalesKpis
);

// GET /api/dashboard/v1/:organizationId/:outletId/sales-by-hour
dashboardRoutes.get(
  '/v1/:organizationId/:outletId/sales-by-hour',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  dashboardController.getSalesByHour
);

// GET /api/dashboard/v1/:organizationId/:outletId/kitchen-ticket-status
dashboardRoutes.get(
  '/v1/:organizationId/:outletId/kitchen-ticket-status',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  dashboardController.getKitchenTicketStatus
);

// GET /api/dashboard/v1/:organizationId/:outletId/top-selling-items?limit=5
dashboardRoutes.get(
  '/v1/:organizationId/:outletId/top-selling-items',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  dashboardController.getTopSellingItems
);

// GET /api/dashboard/v1/:organizationId/:outletId/payment-summary
dashboardRoutes.get(
  '/v1/:organizationId/:outletId/payment-summary',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  dashboardController.getPaymentSummary
);

// GET /api/dashboard/v1/:organizationId/:outletId/quick-stats
dashboardRoutes.get(
  '/v1/:organizationId/:outletId/quick-stats',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  dashboardController.getQuickStats
);



export default dashboardRoutes;