import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as integrationService from './integration.service.js';

export const seedDefaultIntegrations = async (
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

    const created = await integrationService.seedDefaultIntegrations(organizationId, userId);
    return res.status(201).json({ ok: true, data: created });
  } catch (error) {
    next(error);
  }
};

export const listIntegrations = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const integrations = await integrationService.listIntegrations(organizationId);
    return res.status(200).json({ ok: true, data: integrations });
  } catch (error) {
    next(error);
  }
};

export const getIntegration = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const integration = await integrationService.getIntegrationById(organizationId, id);
    return res.status(200).json({ ok: true, data: integration });
  } catch (error) {
    next(error);
  }
};

export const connectIntegration = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const integration = await integrationService.connectIntegration(organizationId, userId, id);
    return res.status(200).json({ ok: true, data: integration });
  } catch (error) {
    next(error);
  }
};

export const disconnectIntegration = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const integration = await integrationService.disconnectIntegration(organizationId, userId, id);
    return res.status(200).json({ ok: true, data: integration });
  } catch (error) {
    next(error);
  }
};