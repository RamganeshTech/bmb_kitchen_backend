import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
// import { ApiError } from '../../utils/apiError.js';
import * as taxSettingsService from './taxSettings.service.js';

export const getTaxSettings = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId } = req.params;
        if (!organizationId) {
            return res.status(400).json({ ok: false, message: 'organizationId is required' });
        }

        const settings = await taxSettingsService.getTaxSettings(organizationId);
        return res.status(200).json({ ok: true, data: settings });
    } catch (error) {
        next(error);
    }
};

export const createTaxSettings = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId } = req.params;
        const userId = req.user!.userId;
        if (!organizationId) {
            return res.status(400).json({ ok: false, message: 'organizationId is required' });
        }

        const { mode, serviceCharge, scOnDinein } = req.body;
        const settings = await taxSettingsService.createTaxSettings(organizationId, userId, {
            mode,
            serviceCharge,
            scOnDinein,
        });

        return res.status(201).json({ ok: true, data: settings });
    } catch (error) {
        next(error);
    }
};

export const updateTaxSettings = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId } = req.params;
        const userId = req.user!.userId;
        if (!organizationId) {
            return res.status(400).json({ ok: false, message: 'organizationId is required' });
        }

        const { mode, serviceCharge, scOnDinein } = req.body;
        const settings = await taxSettingsService.updateTaxSettings(organizationId, userId, {
            mode,
            serviceCharge,
            scOnDinein,
        });

        return res.status(200).json({ ok: true, data: settings });
    } catch (error) {
        next(error);
    }
};

export const addTaxRate = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId } = req.params;
        const userId = req.user!.userId;
        if (!organizationId) {
            return res.status(400).json({ ok: false, message: 'organizationId is required' });
        }

        const { name, percentage } = req.body;
        if (!name || percentage === undefined) {
            return res.status(400).json({ ok: false, message: 'name and percentage are required' });
        }

        const settings = await taxSettingsService.addTaxRate(organizationId, userId, { name, percentage });
        return res.status(200).json({ ok: true, data: settings });
    } catch (error) {
        next(error);
    }
};

export const setDefaultTaxRate = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId, rateId } = req.params;
        const userId = req.user!.userId;
        if (!organizationId || !rateId) {
            return res.status(400).json({ ok: false, message: 'organizationId and rateId are required' });
        }

        const settings = await taxSettingsService.setDefaultTaxRate(organizationId, userId, rateId);
        return res.status(200).json({ ok: true, data: settings });
    } catch (error) {
        next(error);
    }
};