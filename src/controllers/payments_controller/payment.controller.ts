import { NextFunction, type Response } from "express";
import { RoleBasedRequest } from "../../utils/utils.js";
import * as paymentService from './payment.service.js'
import {Types} from "mongoose"

export const listPayments = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { outletId, paymentMethod, orderType, scope, from, to, page, limit } = req.query;

    const result = await paymentService.listPayments(organizationId, {
      outletId: outletId as string,
      paymentMethod: paymentMethod as any,
      orderType: orderType as any,
      scope: scope as any,
      from: from as string,
      to: to as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
};


export const getPaymentById = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id: orderId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ ok: false, message: 'A valid order id is required' });
    }

    const payment = await paymentService.getPaymentById(organizationId, orderId);
    return res.status(200).json({ ok: true, data: payment });
  } catch (error) {
    next(error);
  }
};