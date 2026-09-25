import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as printerService from './printer.service.js';

export const createPrinter = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { outletId, name, type, printerModel, conn, size, copies, categories } = req.body;
    if (!outletId || !name || !type) {
      return res.status(400).json({ ok: false, message: 'outletId, name and type are required' });
    }

    const printer = await printerService.createPrinter(organizationId, userId, {
      outletId,
      name,
      type,
      printerModel,
      conn,
      size,
      copies,
      categories,
    });

    return res.status(201).json({ ok: true, data: printer });
  } catch (error) {
    next(error);
  }
};

export const getPrinter = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const printer = await printerService.getPrinterById(organizationId, id);
    return res.status(200).json({ ok: true, data: printer });
  } catch (error) {
    next(error);
  }
};

export const listActivePrinters = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    const { outletId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const printers = await printerService.listActivePrinters(organizationId, outletId as string);
    return res.status(200).json({ ok: true, data: printers });
  } catch (error) {
    next(error);
  }
};

export const listInactivePrinters = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    const { outletId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const printers = await printerService.listInactivePrinters(organizationId, outletId as string);
    return res.status(200).json({ ok: true, data: printers });
  } catch (error) {
    next(error);
  }
};

export const updatePrinter = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const { name, type, printerModel, conn, size, copies, categories } = req.body;
    const printer = await printerService.updatePrinter(organizationId, userId, id, {
      name,
      type,
      printerModel,
      conn,
      size,
      copies,
      categories,
    });

    return res.status(200).json({ ok: true, data: printer });
  } catch (error) {
    next(error);
  }
};

export const softDeletePrinter = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const printer = await printerService.softDeletePrinter(organizationId, userId, id);
    return res.status(200).json({ ok: true, data: printer });
  } catch (error) {
    next(error);
  }
};

export const restorePrinter = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const printer = await printerService.restorePrinter(organizationId, userId, id);
    return res.status(200).json({ ok: true, data: printer });
  } catch (error) {
    next(error);
  }
};

export const hardDeletePrinter = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    await printerService.hardDeletePrinter(organizationId, id);
    return res.status(200).json({ ok: true, message: 'Printer deleted' });
  } catch (error) {
    next(error);
  }
};