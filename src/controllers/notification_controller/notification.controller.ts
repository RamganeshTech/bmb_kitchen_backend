import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as notificationService from './notification.service.js';

// ── GET ALL NOTIFICATIONS (by outlet) ───────────────────────────────
export const listNotificationsByOutlet = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId, outletId } = req.params;
    const userId = req.user!.userId;
    const { unreadOnly } = req.query;

    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!outletId) {
      return res.status(400).json({ ok: false, message: 'outletId is required' });
    }

    const notifications = await notificationService.listNotificationsByOutlet(
      organizationId,
      outletId,
      userId,
      unreadOnly === 'true'
    );

    return res.status(200).json({ ok: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// ── GET A SINGLE NOTIFICATION ───────────────────────────────────────
export const getNotification = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;

    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const notification = await notificationService.getNotificationById(organizationId, id, userId);
    return res.status(200).json({ ok: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// ── UNREAD COUNT FOR THE LOGGED-IN USER ─────────────────────────────
export const getUnreadCount = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, outletId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!outletId) {
      return res.status(400).json({ ok: false, message: 'outletId is required' });
    }

    const result = await notificationService.getUnreadCount(organizationId, outletId, userId);
    return res.status(200).json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ── MARK AS READ ─────────────────────────────────────────────────────
export const markAsRead = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;

    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const notification = await notificationService.markAsRead(organizationId, id, userId);
    return res.status(200).json({ ok: true, data: notification });
  } catch (error) {
    next(error);
  }
};