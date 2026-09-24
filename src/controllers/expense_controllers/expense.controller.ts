import { Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../../utils/utils.js';
import * as expenseService from './expense.service.js';

// ── CREATE ────────────────────────────────────────────────────────
export const createExpense = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { date, category, description, payee, paymentMode, amount, outletId } = req.body;
    const userId = req.user!.userId;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    if (!date || !category || !description || !paymentMode || amount === undefined) {
      res.status(400).json({
        ok: false,
        message: 'Date, category, description, payment mode, and amount are required',
      });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ ok: false, message: 'Amount must be greater than 0' });
      return;
    }

    const expense = await expenseService.createExpense(organizationId, userId, {
      date,
      category,
      description,
      payee,
      paymentMode,
      amount,
      outletId,
    });

    res.status(201).json({ ok: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getExpenseList = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { outletId } = req.query;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const expenses = await expenseService.getExpenseList(organizationId, outletId);

    res.status(200).json({ ok: true, data: expenses });
  } catch (error) {
    next(error);
  }
};

// ── LIST (inactive / soft-deleted) ────────────────────────────────
export const getInactiveExpenseList = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { outletId } = req.query;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: 'Organization ID is required' });
      return;
    }

    const expenses = await expenseService.getInactiveExpenseList(organizationId, outletId);

    res.status(200).json({ ok: true, data: expenses });
  } catch (error) {
    next(error);
  }
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getExpenseById = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, expenseId } = req.params;

    if (!organizationId || !expenseId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Expense ID are required' });
      return;
    }

    const expense = await expenseService.getExpenseById(organizationId, expenseId);

    res.status(200).json({ ok: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateExpense = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, expenseId } = req.params;
    const userId = req.user!.userId;
    const { date, category, description, payee, paymentMode, amount, outletId } = req.body;

    if (!organizationId || !expenseId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Expense ID are required' });
      return;
    }

    const expense = await expenseService.updateExpense(organizationId, expenseId, userId, {
      date,
      category,
      description,
      payee,
      paymentMode,
      amount,
      outletId,
    });

    res.status(200).json({ ok: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// ── SOFT DELETE ───────────────────────────────────────────────────
export const softDeleteExpense = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, expenseId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !expenseId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Expense ID are required' });
      return;
    }

    const expense = await expenseService.softDeleteExpense(organizationId, expenseId, userId);

    res.status(200).json({ ok: true, message: 'Expense deactivated', data: expense });
  } catch (error) {
    next(error);
  }
};

// ── RESTORE ────────────────────────────────────────────────────────
export const restoreExpense = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, expenseId } = req.params;
    const userId = req.user!.userId;

    if (!organizationId || !expenseId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Expense ID are required' });
      return;
    }

    const expense = await expenseService.restoreExpense(organizationId, expenseId, userId);

    res.status(200).json({ ok: true, message: 'Expense restored', data: expense });
  } catch (error) {
    next(error);
  }
};

// ── HARD DELETE ───────────────────────────────────────────────────
export const hardDeleteExpense = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, expenseId } = req.params;

    if (!organizationId || !expenseId) {
      res.status(400).json({ ok: false, message: 'Organization ID and Expense ID are required' });
      return;
    }

    await expenseService.hardDeleteExpense(organizationId, expenseId);

    res.status(200).json({ ok: true, message: 'Expense permanently deleted' });
  } catch (error) {
    next(error);
  }
};