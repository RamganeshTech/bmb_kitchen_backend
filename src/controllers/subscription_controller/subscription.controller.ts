import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as subscriptionService from './subscription.service.js';

export const getSubscription = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const subscription = await subscriptionService.getSubscription(organizationId);
    return res.status(200).json({ ok: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

export const createSubscription = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { plan, price, cycle, outletsIncluded, renewsAt } = req.body;
    if (!plan || price === undefined || !outletsIncluded || !renewsAt) {
      return res
        .status(400)
        .json({ ok: false, message: 'plan, price, outletsIncluded and renewsAt are required' });
    }

    const subscription = await subscriptionService.createSubscription(organizationId, userId, {
      plan,
      price,
      cycle,
      outletsIncluded,
      renewsAt,
    });

    return res.status(201).json({ ok: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

export const changePlan = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { plan, price, outletsIncluded } = req.body;
    if (!plan || price === undefined || !outletsIncluded) {
      return res
        .status(400)
        .json({ ok: false, message: 'plan, price and outletsIncluded are required' });
    }

    const subscription = await subscriptionService.changePlan(organizationId, userId, {
      plan,
      price,
      outletsIncluded,
    });

    return res.status(200).json({ ok: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

export const addInvoice = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { invoiceNo, date, amount, status } = req.body;
    if (!invoiceNo || amount === undefined) {
      return res.status(400).json({ ok: false, message: 'invoiceNo and amount are required' });
    }

    const subscription = await subscriptionService.addInvoice(organizationId, userId, {
      invoiceNo,
      date,
      amount,
      status,
    });

    return res.status(200).json({ ok: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

export const listInvoices = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const invoices = await subscriptionService.listInvoices(organizationId);
    return res.status(200).json({ ok: true, data: invoices });
  } catch (error) {
    next(error);
  }
};