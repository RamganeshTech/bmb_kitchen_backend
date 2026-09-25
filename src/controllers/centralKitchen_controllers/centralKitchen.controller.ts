import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import { Types } from 'mongoose';

import * as centralKitchenService from './centralKitchen.service.js';

export const createTransfer = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId } = req.params;
        const userId = req.user!.userId;
        const { fromOutletId, toOutletId, lines } = req.body;


        if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
            res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
            return;
        }

        if (!fromOutletId || !toOutletId) {
            return res.status(400).json({ ok: false, message: 'fromOutletId and toOutletId are required' });
        }
        if (!Array.isArray(lines) || !lines.length) {
            return res.status(400).json({ ok: false, message: 'At least one line item is required' });
        }

        const transfer = await centralKitchenService.createTransfer(organizationId, userId, {
            fromOutletId,
            toOutletId,
            lines,
        });

        return res.status(201).json({ ok: true, data: transfer });
    } catch (error) {
        next(error);
    }
};

export const getTransfer = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId, id } = req.params;

        if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
            res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
            return;
        }


        if (!id || !Types.ObjectId.isValid(id)) {
            res.status(400).json({ ok: false, message: 'id is required' });
            return;
        }
        const transfer = await centralKitchenService.getTransferById(organizationId, id);
        return res.status(200).json({ ok: true, data: transfer });
    } catch (error) {
        next(error);
    }
};

export const listActiveTransfers = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId } = req.params;

        if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
            res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
            return;
        }


        const transfers = await centralKitchenService.listActiveTransfers(organizationId);
        return res.status(200).json({ ok: true, data: transfers });
    } catch (error) {
        next(error);
    }
};

export const listInactiveTransfers = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId } = req.params;

        if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
            res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
            return;
        }

        const transfers = await centralKitchenService.listInactiveTransfers(organizationId);
        return res.status(200).json({ ok: true, data: transfers });
    } catch (error) {
        next(error);
    }
};

export const updateTransferStage = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId, id } = req.params;
        const userId = req.user!.userId;
        const { status } = req.body;

        if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
            res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
            return;
        }

        if (!id || !Types.ObjectId.isValid(id)) {
            res.status(400).json({ ok: false, message: 'id is required' });
            return;
        }

        if (!status) {
            return res.status(400).json({ ok: false, message: 'status is required' });
        }

        const transfer = await centralKitchenService.updateTransferStage(organizationId, userId, id, status);
        return res.status(200).json({ ok: true, data: transfer });
    } catch (error) {
        next(error);
    }
};

export const softDeleteTransfer = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId, id } = req.params;
        const userId = req.user!.userId;

        if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
            res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
            return;
        }
        if (!id || !Types.ObjectId.isValid(id)) {
            res.status(400).json({ ok: false, message: 'id is required' });
            return;
        }
        const transfer = await centralKitchenService.softDeleteTransfer(organizationId, userId, id);
        return res.status(200).json({ ok: true, data: transfer });
    } catch (error) {
        next(error);
    }
};

export const restoreTransfer = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId, id } = req.params;
        const userId = req.user!.userId;
         if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
            res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
            return;
        }
        if (!id || !Types.ObjectId.isValid(id)) {
            res.status(400).json({ ok: false, message: 'id is required' });
            return;
        }

        const transfer = await centralKitchenService.restoreTransfer(organizationId, userId, id);
        return res.status(200).json({ ok: true, data: transfer });
    } catch (error) {
        next(error);
    }
};

export const hardDeleteTransfer = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId, id } = req.params;
         if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
            res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
            return;
        }
        if (!id || !Types.ObjectId.isValid(id)) {
            res.status(400).json({ ok: false, message: 'id is required' });
            return;
        }
        await centralKitchenService.hardDeleteTransfer(organizationId, id);
        return res.status(200).json({ ok: true, message: 'Transfer deleted' });
    } catch (error) {
        next(error);
    }
};