import type { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import * as customerService from './customer.services.js';
import type { RoleBasedRequest } from '../../utils/utils.js';

export const createCustomer = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { name, phone, email } = req.body;
    const userId = req.user!.userId;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ ok: false, message: 'A valid name is required' });
      return;
    }

    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      res.status(400).json({ ok: false, message: 'A valid phone number is required' });
      return;
    }

    const customer = await customerService.createCustomer(organizationId, userId, {
      name,
      phone,
      email,
    });

    res.status(201).json({ ok: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const getActiveCustomers = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    const customers = await customerService.getActiveCustomers(organizationId);
    res.status(200).json({ ok: true, data: customers });
  } catch (error) {
    next(error);
  }
};

export const getInactiveCustomers = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    const customers = await customerService.getInactiveCustomers(organizationId);
    res.status(200).json({ ok: true, data: customers });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ ok: false, message: 'A valid Customer ID is required' });
      return;
    }

    const customer = await customerService.getCustomerById(organizationId, id);
    res.status(200).json({ ok: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const getCustomerDropdown = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    const dropdownList = await customerService.getCustomerDropdown(organizationId);
    res.status(200).json({ ok: true, data: dropdownList });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params;
    const { name, phone, email } = req.body;
    const userId = req.user!.userId;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ ok: false, message: 'A valid Customer ID is required' });
      return;
    }

    const updatedCustomer = await customerService.updateCustomer(
      organizationId,
      id,
      userId,
      { name, phone, email }
    );

    res.status(200).json({ ok: true, data: updatedCustomer });
  } catch (error) {
    next(error);
  }
};

export const softDeleteCustomer = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ ok: false, message: 'A valid Customer ID is required' });
      return;
    }

    await customerService.softDeleteCustomer(organizationId, id, userId);
    res.status(200).json({ ok: true, message: 'Customer deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

export const recoverCustomer = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ ok: false, message: 'A valid Customer ID is required' });
      return;
    }

    await customerService.recoverCustomer(organizationId, id, userId);
    res.status(200).json({ ok: true, message: 'Customer recovered successfully' });
  } catch (error) {
    next(error);
  }
};

export const hardDeleteCustomer = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({ ok: false, message: 'A valid Organization ID is required' });
      return;
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ ok: false, message: 'A valid Customer ID is required' });
      return;
    }

    await customerService.hardDeleteCustomer(organizationId, id);
    res.status(200).json({ ok: true, message: 'Customer permanently deleted' });
  } catch (error) {
    next(error);
  }
};