

import type { Response, NextFunction } from 'express';
import * as tableService from './restaurantTable.services.js';
import type { RoleBasedRequest } from '../../utils/utils.js';
import type { TableStatus } from '../../models/restaurant_table_model/restaurantTable.model.js';

export const createTable = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { tableName, capacity, location, taxPercent } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!tableName) {
      res.status(400).json({ ok: false, message: 'Table name is required' });
      return;
    }

    if (!capacity || typeof capacity !== 'number' || capacity < 1) {
      res.status(400).json({ ok: false, message: 'A valid table capacity (>= 1) is required' });
      return;
    }

    const table = await tableService.createTable(organizationId, userId, { tableName, capacity, location });
    res.status(201).json({ ok: true, data: table });
  } catch (error) {
    next(error);
  }
};

export const getActiveTables = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const tables = await tableService.getAllActiveTables(organizationId);
    res.status(200).json({ ok: true, data: tables });
  } catch (error) {
    next(error);
  }
};

export const getInactiveTables = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const tables = await tableService.getAllInactiveTables(organizationId);
    res.status(200).json({ ok: true, data: tables });
  } catch (error) {
    next(error);
  }
};

export const getTableById = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!id) {
      res.status(400).json({ ok: false, message: 'ID is required' });
      return;
    }

    const table = await tableService.getTableById(organizationId, id);
    res.status(200).json({ ok: true, data: table });
  } catch (error) {
    next(error);
  }
};

export const getTableDropdown = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const dropdownList = await tableService.getTableDropdown(organizationId);
    res.status(200).json({ ok: true, data: dropdownList });
  } catch (error) {
    next(error);
  }
};

export const updateTableDetails = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params;
    const { tableName, capacity, location } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!id) {
      res.status(400).json({ ok: false, message: 'ID is required' });
      return;
    }

    const updatedTable = await tableService.updateTableDetails(
      organizationId,
      id,
      userId,
      { tableName, capacity, location }
    );
    res.status(200).json({ ok: true, data: updatedTable });
  } catch (error) {
    next(error);
  }
};

export const updateTableStatus = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params;
    const { status } = req.body as { status: TableStatus };
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!id) {
      res.status(400).json({ ok: false, message: 'ID is required' });
      return;
    }

    if (!['available', 'occupied', 'reserved'].includes(status)) {
      res.status(400).json({ ok: false, message: 'Invalid status. Must be available, occupied, or reserved.' });
      return;
    }

    const updatedTable = await tableService.updateTableStatus(organizationId, id, userId, status);
    res.status(200).json({ ok: true, data: updatedTable });
  } catch (error) {
    next(error);
  }
};

export const reserveTable = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params;
    const { customerName, reservationTime, phone, notes } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!id) {
      res.status(400).json({ ok: false, message: 'ID is required' });
      return;
    }

    if (!customerName || !reservationTime) {
      res.status(400).json({ ok: false, message: 'Customer name and reservation time are required' });
      return;
    }

    const reservationData = {
      customerName,
      reservationTime: new Date(reservationTime),
      phone,
      notes,
    };

    const updatedTable = await tableService.reserveTable(organizationId, id, userId, reservationData);
    res.status(200).json({ ok: true, message: 'Table reserved successfully', data: updatedTable });
  } catch (error) {
    next(error);
  }
};

export const softDeleteTable = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!id) {
      res.status(400).json({ ok: false, message: 'ID is required' });
      return;
    }

    await tableService.softDeleteTable(organizationId, id, userId);
    res.status(200).json({ ok: true, message: 'Table deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

export const recoverTable = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!id) {
      res.status(400).json({ ok: false, message: 'ID is required' });
      return;
    }

    await tableService.recoverTable(organizationId, id, userId);
    res.status(200).json({ ok: true, message: 'Table recovered successfully' });
  } catch (error) {
    next(error);
  }
};

export const hardDeleteTable = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, id } = req.params;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!id) {
      res.status(400).json({ ok: false, message: 'ID is required' });
      return;
    }

    await tableService.hardDeleteTable(organizationId, id);
    res.status(200).json({ ok: true, message: 'Table permanently deleted' });
  } catch (error) {
    next(error);
  }
};