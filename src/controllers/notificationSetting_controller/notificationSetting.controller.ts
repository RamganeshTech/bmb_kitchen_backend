import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as notificationSettingsService from './notificationSetting.service.js';

export const getNotificationSettings = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const settings = await notificationSettingsService.getNotificationSettings(organizationId);
    return res.status(200).json({ ok: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const createNotificationSettings = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { channels, events } = req.body;
    const settings = await notificationSettingsService.createNotificationSettings(
      organizationId,
      userId,
      { channels, events }
    );

    return res.status(201).json({ ok: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateChannel = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, channel } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { isEnabled } = req.body;
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({ ok: false, message: 'isEnabled (boolean) is required' });
    }

    const settings = await notificationSettingsService.updateChannel(
      organizationId,
      userId,
      channel as any,
      isEnabled
    );

    return res.status(200).json({ ok: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, event } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { isEnabled } = req.body;
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({ ok: false, message: 'isEnabled (boolean) is required' });
    }

    const settings = await notificationSettingsService.updateEvent(
      organizationId,
      userId,
      event as any,
      isEnabled
    );

    return res.status(200).json({ ok: true, data: settings });
  } catch (error) {
    next(error);
  }
};