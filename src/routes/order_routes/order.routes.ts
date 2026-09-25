import { Router } from 'express';
import * as orderController from '../../controllers/order_controllers/order.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';

const orderRoutes = Router({ mergeParams: true });

// ── COLLECTION ENDPOINTS ──────────────────────────────────────────
// GET /api/orders/v1/:organizationId (List active POS orders)
orderRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  orderController.getActiveOrders
);

// POST /api/orders/v1/:organizationId (Place new order & occupy table)
orderRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  orderController.placeNewOrder
);

// ── SINGLE ORDER ENDPOINTS ────────────────────────────────────────
// GET /api/orders/v1/:organizationId/:id
orderRoutes.get(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  orderController.getOrderById
);

// POST /api/orders/v1/:organizationId/:id/items (Add more food)
orderRoutes.post(
  '/v1/:organizationId/:id/items',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  orderController.addItemsToExistingOrder
);

// PATCH /api/orders/v1/:organizationId/:id/items/:itemId/status (Kitchen KDS Update)
orderRoutes.patch(
  '/v1/:organizationId/:id/items/:itemId/status',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  orderController.updateItemKitchenStatus
);

// ── CHECKOUT & CANCELLATION ───────────────────────────────────────
// POST /api/orders/v1/:organizationId/:id/checkout (Process Bill & Free Table)
orderRoutes.post(
  '/v1/:organizationId/:id/checkout',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  orderController.processOrderCheckout
);

// PATCH /api/orders/v1/:organizationId/:id/cancel (Cancel order & Free Table)
orderRoutes.patch(
  '/v1/:organizationId/:id/cancel',
  multiAuthRole('owner', 'admin', 'cto'), // Staff usually cannot cancel entire orders, requires Admin/CTO/Owner
  orderController.cancelOrder
);

// GET /api/orders/v1/:organizationId/:id/cancel (Cancel order & Free Table)

orderRoutes.get(
  '/v1/:organizationId/orders/:orderType',
  multiAuthRole('owner', 'admin', 'cto', "staff"), // Staff usually cannot cancel entire orders, requires Admin/CTO/Owner
  orderController.listOrdersByType
);



export default orderRoutes;