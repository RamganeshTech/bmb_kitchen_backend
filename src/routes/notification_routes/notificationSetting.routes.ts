import { Router } from 'express';
import * as notificationSettingsController from "../../controllers/notificationSetting_controller/notificationSetting.controller.js";
import { multiAuthRole } from "../../middleware/auth.middleware.js";

const notificationSettingsRoutes = Router({ mergeParams: true });

// ── CONFIGURATION ENDPOINTS (Singleton per Organization) ──────────

// GET /api/notification-settings/v1/:organizationId
notificationSettingsRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'),
  notificationSettingsController.getNotificationSettings
);

// POST /api/notification-settings/v1/:organizationId (Initial Setup)
notificationSettingsRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'),
  notificationSettingsController.createNotificationSettings
);

// ── CHANNEL TOGGLES (WhatsApp / SMS / Email) ─────────────────────────

// PATCH /api/notification-settings/v1/:organizationId/channels/:channel
notificationSettingsRoutes.patch(
  '/v1/:organizationId/channels/:channel',
  multiAuthRole('owner', 'admin', 'cto'),
  notificationSettingsController.updateChannel
);

// ── EVENT TOGGLES (billShare / orderReady / lowStock / dayClosing / newOnline / offerBlast) ─

// PATCH /api/notification-settings/v1/:organizationId/events/:event
notificationSettingsRoutes.patch(
  '/v1/:organizationId/events/:event',
  multiAuthRole('owner', 'admin', 'cto'),
  notificationSettingsController.updateEvent
);

export default notificationSettingsRoutes;