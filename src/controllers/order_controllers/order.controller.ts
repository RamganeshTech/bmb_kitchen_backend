import type { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import * as orderService from './order.services.js';
import type { RoleBasedRequest } from '../../utils/utils.js';
import { IOrder, ItemKitchenStatus } from '../../models/order_models/order.model.js';

// ── 1. PLACE NEW ORDER (Start) ────────────────────────────────────
export const placeNewOrder = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { tableId, customerId, orderType, items, outletId } = req.body;
    const userId = req.user!.userId;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    if (tableId && !Types.ObjectId.isValid(tableId)) {
      res.status(400).json({ ok: false, message: 'A valid Table ID is required' });
      return;
    }

    if (!outletId || !Types.ObjectId.isValid(outletId)) {
      res.status(400).json({ ok: false, message: 'A valid outlet ID is required' });
      return;
    }

    if (customerId && !Types.ObjectId.isValid(customerId)) {
      res.status(400).json({ ok: false, message: 'A valid Customer ID is required' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ ok: false, message: 'An order must contain at least one item' });
      return;
    }

    const order = await orderService.createOrder(organizationId, userId, {
      tableId,
      customerId,
      outletId,
      orderType,
      items,
    });

    res.status(201).json({ ok: true, data: order });
  } catch (error) {
    next(error);
  }
};

// ── 2. ADD ITEMS TO EXISTING ORDER ────────────────────────────────
export const addItemsToExistingOrder = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id: orderId } = req.params;
    const { items } = req.body;
    const userId = req.user!.userId;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ ok: false, message: 'A valid Order ID is required' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ ok: false, message: 'Must provide items to add' });
      return;
    }

    const updatedOrder = await orderService.addItemsToOrder(organizationId, orderId, userId, items);
    res.status(200).json({ ok: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// ── 3. UPDATE KITCHEN STATUS ──────────────────────────────────────
export const updateItemKitchenStatus = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id: orderId, itemId } = req.params;
    const { status } = req.body;
    const userId = req.user!.userId;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ ok: false, message: 'A valid Order ID is required' });
      return;
    }

    if (!itemId || !Types.ObjectId.isValid(itemId)) {
      res.status(400).json({ ok: false, message: 'A valid Item ID is required' });
      return;
    }

    const validStatuses = ['in_queue', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ ok: false, message: 'Invalid kitchen status' });
      return;
    }

    const updatedOrder = await orderService.updateOrderItemStatus(organizationId, orderId, itemId, userId, status);
    res.status(200).json({ ok: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};


const parseCheckoutInput = (src: any) => {
  const { offerId, loyaltyPointsRedeemed = 0, manualDiscount = 0 } = src;
  const points = Number(loyaltyPointsRedeemed);
  const manual = Number(manualDiscount);

  if (!Number.isInteger(points) || points < 0) return { error: 'Loyalty points must be a whole number, 0 or more' };
  if (!Number.isFinite(manual) || manual < 0) return { error: 'Manual discount must be 0 or more' };
  if (offerId && !Types.ObjectId.isValid(String(offerId))) return { error: 'A valid Offer ID is required' };

  return {
    value: {
      offerId: offerId ? String(offerId) : undefined,
      loyaltyPointsRedeemed: points,
      manualDiscount: manual,
    },
  };
};

// ── 4. PROCESS CHECKOUT & BILLING ─────────────────────────────────
export const processOrderCheckout = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id: orderId } = req.params;
    const { paymentMethod,
      // loyaltyPointsRedeemed = 0, manualDiscount = 0 
    } = req.body;
    const userId = req.user!.userId;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ ok: false, message: 'A valid Order ID is required' });
      return;
    }

    if (!paymentMethod) {
      res.status(400).json({ ok: false, message: 'Payment method is required' });
      return;
    }

    const parsed = parseCheckoutInput(req.body);
    if (parsed.error) {
      res.status(400).json({ ok: false, message: parsed.error });
      return;
    }

    // const completedOrder = await orderService.checkoutOrder(organizationId, orderId, userId, {
    //   paymentMethod,
    //   loyaltyPointsRedeemed,
    //   manualDiscount,
    // });

    const completedOrder = await orderService.checkoutOrder(organizationId, orderId, userId, {
      paymentMethod,
      ...parsed.value!,
    });

    res.status(200).json({ ok: true, data: completedOrder });
  } catch (error) {
    next(error);
  }
};



// ── 4b. CHECKOUT PREVIEW ──────────────────────────────────────────
export const previewOrderCheckout = async (req: RoleBasedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { organizationId, id: orderId } = req.params;

    if (!organizationId || !Types.ObjectId.isValid(organizationId) || !orderId || !Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ ok: false, message: 'Valid Organization ID and Order ID are required' });
      return;
    }

    const parsed = parseCheckoutInput(req.query);
    if (parsed.error) {
      res.status(400).json({ ok: false, message: parsed.error });
      return;
    }

    const preview = await orderService.previewCheckout(organizationId, orderId, parsed.value!);
    res.status(200).json({ ok: true, data: preview });
  } catch (error) {
    next(error);
  }
};

// ── 5. CANCEL ORDER ───────────────────────────────────────────────
export const cancelOrder = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id: orderId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ ok: false, message: 'A valid Order ID is required' });
      return;
    }

    const cancelledOrder = await orderService.cancelOrder(organizationId, orderId, userId);
    res.status(200).json({ ok: true, data: cancelledOrder });
  } catch (error) {
    next(error);
  }
};

// ── 6. GET ALL ACTIVE POS ORDERS ──────────────────────────────────
export const getActiveOrders = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;

    const { outletId } = req.query

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    const orders = await orderService.getActiveOrders(organizationId, outletId);
    res.status(200).json({ ok: true, data: orders });
  } catch (error) {
    next(error);
  }
};


const VALID_SCOPES = ['today', 'week', 'month', 'year', 'custom', 'all'];
const VALID_ORDER_TYPES = ['dine_in', 'takeaway', 'delivery', 'online'];
const VALID_PAYMENT_METHODS = ['cash', 'card', 'upi', 'split'];
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export const getMyOrders = async (req: RoleBasedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.userId;
    const {
      outletId, scope, from, to, orderType, paymentMethod, tableId, customerId,
      search, minAmount, maxAmount, hasDiscount, sortBy, sortOrder, page, limit,
    } = req.query;

    // console.log("calling this one lget my orders only")

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    for (const [label, value] of [['outletId', outletId], ['tableId', tableId], ['customerId', customerId]] as const) {
      if (value && !Types.ObjectId.isValid(String(value))) {
        res.status(400).json({ ok: false, message: `A valid ${label} is required` });
        return;
      }
    }

    if (scope && !VALID_SCOPES.includes(String(scope))) {
      res.status(400).json({ ok: false, message: `scope must be one of: ${VALID_SCOPES.join(', ')}` });
      return;
    }
    if (scope === 'custom') {
      if (!from || !to || !DATE_FORMAT.test(String(from)) || !DATE_FORMAT.test(String(to))) {
        res.status(400).json({ ok: false, message: 'from and to must be valid dates (YYYY-MM-DD)' });
        return;
      }
      if (String(from) > String(to)) {
        res.status(400).json({ ok: false, message: 'from cannot be after to' });
        return;
      }
    }

    if (orderType && !VALID_ORDER_TYPES.includes(String(orderType))) {
      res.status(400).json({ ok: false, message: `orderType must be one of: ${VALID_ORDER_TYPES.join(', ')}` });
      return;
    }
    if (paymentMethod && !VALID_PAYMENT_METHODS.includes(String(paymentMethod))) {
      res.status(400).json({ ok: false, message: `paymentMethod must be one of: ${VALID_PAYMENT_METHODS.join(', ')}` });
      return;
    }

    const min = minAmount !== undefined && minAmount !== '' ? Number(minAmount) : undefined;
    const max = maxAmount !== undefined && maxAmount !== '' ? Number(maxAmount) : undefined;
    if ((min !== undefined && isNaN(min)) || (max !== undefined && isNaN(max))) {
      res.status(400).json({ ok: false, message: 'minAmount and maxAmount must be numbers' });
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      res.status(400).json({ ok: false, message: 'minAmount cannot be greater than maxAmount' });
      return;
    }

    const data = await orderService.listMyOrders(organizationId, userId, {
      outletId: outletId ? String(outletId) : undefined,
      scope: scope as any,
      from: from ? String(from) : undefined,
      to: to ? String(to) : undefined,
      orderType: orderType as any,
      paymentMethod: paymentMethod as any,
      tableId: tableId ? String(tableId) : undefined,
      customerId: customerId ? String(customerId) : undefined,
      search: search ? String(search).trim() : undefined,
      minAmount: min,
      maxAmount: max,
      hasDiscount: hasDiscount === 'true' ? true : hasDiscount === 'false' ? false : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

// ── 7. GET SINGLE ORDER ───────────────────────────────────────────
export const getOrderById = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id: orderId } = req.params;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    console.log("calling this one lget get order by id  only")

    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ ok: false, message: 'A valid Order ID is required' });
      return;
    }

    const order = await orderService.getOrderById(organizationId, orderId);
    res.status(200).json({ ok: true, data: order });
  } catch (error) {
    next(error);
  }
};


//  TO FILTER OUT THE TAKEAWAY , ONLINE DELIVERY , IN DINE ORDERS


export const listOrdersByType = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, orderType } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!orderType) {
      return res.status(400).json({ ok: false, message: 'orderType is required' });
    }

    const { outletId, orderStatus, paymentStatus, scope, from, to, page, limit } = req.query;

    const result = await orderService.listOrdersByType(organizationId, orderType as any, {
      outletId: outletId as string,
      orderStatus: orderStatus as any,
      paymentStatus: paymentStatus as any,
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



//  KITCHEN STATUS


// ── KITCHEN BOARD ─────────────────────────────────────────────────
export const getKitchenItems = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    // const { outletId, status, orderType, scope, page, limit } = req.query;
    const { outletId, status, orderType, scope, page, limit, range, from, to, search } = req.query;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }



    if (outletId && !Types.ObjectId.isValid(String(outletId))) {
      res.status(400).json({ ok: false, message: 'A valid outlet ID is required' });
      return;
    }

    // status can be "preparing" or "in_queue,preparing"
    const statuses = status
      ? String(status).split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const validStatuses = ['in_queue', 'preparing', 'ready', 'served', 'cancelled'];
    if (statuses && statuses.some((s) => !validStatuses.includes(s))) {
      res.status(400).json({ ok: false, message: `status must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    if (scope && !['running', 'today'].includes(String(scope))) {
      res.status(400).json({ ok: false, message: 'scope must be running or today' });
      return;
    }


    const validRanges = ['today', 'week', 'month', 'year', 'custom'];
    if (range && !validRanges.includes(String(range))) {
      res.status(400).json({ ok: false, message: `range must be one of: ${validRanges.join(', ')}` });
      return;
    }

    if (range === 'custom') {
      const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
      if (!from || !to || !dateFormat.test(String(from)) || !dateFormat.test(String(to))) {
        res.status(400).json({ ok: false, message: 'from and to must be valid dates (YYYY-MM-DD)' });
        return;
      }
      if (String(from) > String(to)) {
        res.status(400).json({ ok: false, message: 'from cannot be after to' });
        return;
      }
    }
    const data = await orderService.listKitchenItems(organizationId, {
      outletId: outletId ? String(outletId) : undefined,
      statuses: statuses as ItemKitchenStatus[] | undefined,
      orderType: orderType ? (String(orderType) as IOrder['orderType']) : undefined,
      scope: scope as 'running' | 'today' | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      range: range as 'today' | 'week' | 'month' | 'year' | 'custom' | undefined,
      from: from ? String(from) : undefined,
      to: to ? String(to) : undefined,
      search: search ? String(search).trim() : undefined,
    });

    res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};