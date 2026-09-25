import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as supportTicketService from './supportTicket.service.js';

export const createTicket = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { outletId, subject, category, priority, details } = req.body;
    if (!outletId || !subject) {
      return res.status(400).json({ ok: false, message: 'outletId and subject are required' });
    }

    const ticket = await supportTicketService.createTicket(organizationId, userId, {
      outletId,
      subject,
      category,
      priority,
      details,
    });

    return res.status(201).json({ ok: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

export const getTicket = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const ticket = await supportTicketService.getTicketById(organizationId, id);
    return res.status(200).json({ ok: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

export const listActiveTickets = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { outletId, status, category, priority } = req.query;
    const tickets = await supportTicketService.listActiveTickets(organizationId, {
      outletId: outletId as string,
      status: status as string,
      category: category as string,
      priority: priority as string,
    });

    return res.status(200).json({ ok: true, data: tickets });
  } catch (error) {
    next(error);
  }
};

export const listInactiveTickets = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const tickets = await supportTicketService.listInactiveTickets(organizationId);
    return res.status(200).json({ ok: true, data: tickets });
  } catch (error) {
    next(error);
  }
};

export const advanceTicketStatus = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const ticket = await supportTicketService.advanceTicketStatus(organizationId, userId, id);
    return res.status(200).json({ ok: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

export const softDeleteTicket = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const ticket = await supportTicketService.softDeleteTicket(organizationId, userId, id);
    return res.status(200).json({ ok: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

export const restoreTicket = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const ticket = await supportTicketService.restoreTicket(organizationId, userId, id);
    return res.status(200).json({ ok: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

export const hardDeleteTicket = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    await supportTicketService.hardDeleteTicket(organizationId, id);
    return res.status(200).json({ ok: true, message: 'Ticket deleted' });
  } catch (error) {
    next(error);
  }
};