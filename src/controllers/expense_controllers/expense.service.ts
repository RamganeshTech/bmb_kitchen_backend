import { Types } from 'mongoose';
import { ApiError } from '../../utils/apiError.js';
import ExpenseModel, { IExpense } from '../../models/expense_model/expense.model.js';

// ── CREATE ────────────────────────────────────────────────────────
export const createExpense = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<IExpense>
): Promise<IExpense> => {
  const expense = await ExpenseModel.create({
    ...data,
    organizationId,
    createdBy: userId,
  });

  return expense;
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getExpenseList = async (
  organizationId: string | Types.ObjectId,
  outletId?: string | Types.ObjectId
): Promise<IExpense[]> => {

    
  const query:Record<string, any> = {
    organizationId,
     isActive: true
  }

  if(outletId){
    query.outletId = outletId
  }

  const expenses = await ExpenseModel.find(query).sort({ date: -1 });

  return expenses;
};

// ── LIST (inactive / soft-deleted, full detail) ──────────────────
export const getInactiveExpenseList = async (
  organizationId: string | Types.ObjectId,
  outletId?: string | Types.ObjectId

): Promise<IExpense[]> => {

    
  const query:Record<string, any> = {
    organizationId,
     isActive: false
  }

  if(outletId){
    query.outletId = outletId
  }

  const expenses = await ExpenseModel.find(query).sort({
    updatedAt: -1,
  });

  return expenses;
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getExpenseById = async (
  organizationId: string | Types.ObjectId,
  expenseId: string | Types.ObjectId
): Promise<IExpense> => {
  const expense = await ExpenseModel.findOne({ _id: expenseId, organizationId });

  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  return expense;
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateExpense = async (
  organizationId: string | Types.ObjectId,
  expenseId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: Partial<IExpense>
): Promise<IExpense> => {
  const expense = await ExpenseModel.findOneAndUpdate(
    { _id: expenseId, organizationId },
    { ...data, updatedBy: userId },
    { new: true, runValidators: true }
  );

  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  return expense;
};

// ── SOFT DELETE (isActive: false) ─────────────────────────────────
export const softDeleteExpense = async (
  organizationId: string | Types.ObjectId,
  expenseId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IExpense> => {
  const expense = await ExpenseModel.findOneAndUpdate(
    { _id: expenseId, organizationId },
    { isActive: false, updatedBy: userId },
    { new: true }
  );

  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  return expense;
};

// ── RESTORE (isActive: false → true) ──────────────────────────────
export const restoreExpense = async (
  organizationId: string | Types.ObjectId,
  expenseId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<IExpense> => {
  const expense = await ExpenseModel.findOneAndUpdate(
    { _id: expenseId, organizationId },
    { isActive: true, updatedBy: userId },
    { new: true }
  );

  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  return expense;
};

// ── HARD DELETE (permanent) ───────────────────────────────────────
export const hardDeleteExpense = async (
  organizationId: string | Types.ObjectId,
  expenseId: string | Types.ObjectId
): Promise<void> => {
  const expense = await ExpenseModel.findOneAndDelete({ _id: expenseId, organizationId });

  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }
};