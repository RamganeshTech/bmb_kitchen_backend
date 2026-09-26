import { Router } from 'express';
import * as notificationController from "../../controllers/notification_controller/notification.controller.js";
import { multiAuthRole } from "../../middleware/auth.middleware.js";

const notificationRoutes = Router({ mergeParams: true });

// ── GET ALL NOTIFICATIONS (by outlet, org-wide ones included) ──────

// GET /api/notification/v1/:organizationId/:outletId?unreadOnly=true
notificationRoutes.get(
  '/v1/:organizationId/:outletId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  notificationController.listNotificationsByOutlet
);

// ── UNREAD COUNT FOR THE LOGGED-IN USER ─────────────────────────────

// GET /api/notification/v1/:organizationId/:outletId/unread-count
notificationRoutes.get(
  '/v1/:organizationId/:outletId/unread-count',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  notificationController.getUnreadCount
);

// ── GET A SINGLE NOTIFICATION ───────────────────────────────────────

// GET /api/notification/v1/:organizationId/single/:id
notificationRoutes.get(
  '/v1/:organizationId/single/:id',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  notificationController.getNotification
);

// ── MARK AS READ ─────────────────────────────────────────────────────

// PATCH /api/notification/v1/:organizationId/:id/read
notificationRoutes.patch(
  '/v1/:organizationId/:id/read',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  notificationController.markAsRead
);

export default notificationRoutes;