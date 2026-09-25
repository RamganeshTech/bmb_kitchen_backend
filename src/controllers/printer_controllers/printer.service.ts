import PrinterModel from '../../models/printer_model/printer.model.js';
import { ApiError } from '../../utils/apiError.js';

interface CreatePrinterInput {
  outletId: string;
  name: string;
  type: 'Bill' | 'KOT';
  printerModel?: string;
  conn?: string;
  size?: '80mm' | '58mm';
  copies?: number;
  categories?: string[];
}

interface UpdatePrinterInput {
  name?: string;
  type?: 'Bill' | 'KOT';
  printerModel?: string;
  conn?: string;
  size?: '80mm' | '58mm';
  copies?: number;
  categories?: string[];
}

export const createPrinter = async (
  organizationId: string,
  userId: string,
  payload: CreatePrinterInput
) => {
  const { outletId, name, type } = payload;

  if (!outletId || !name?.trim() || !type) {
    throw new ApiError(400, 'outletId, name and type are required');
  }

  const printer = await PrinterModel.create({
    organizationId,
    outletId,
    name: name.trim(),
    type,
    printerModel: payload.printerModel,
    conn: payload.conn,
    size: payload.size,
    copies: payload.copies,
    categories: payload.categories || [],
    createdBy: userId,
  });

  return printer;
};

export const getPrinterById = async (organizationId: string, id: string) => {
  const printer = await PrinterModel.findOne({ _id: id, organizationId }).populate(
    'outletId',
    'name code'
  );
  if (!printer) throw new ApiError(404, 'Printer not found');
  return printer;
};

export const listActivePrinters = async (organizationId: string, outletId?: string) => {
  const query: Record<string, any> = { organizationId, isActive: true };
  if (outletId) query.outletId = outletId;

  return PrinterModel.find(query).populate('outletId', 'name code').sort({ createdAt: -1 });
};

export const listInactivePrinters = async (organizationId: string, outletId?: string) => {
  const query: Record<string, any> = { organizationId, isActive: false };
  if (outletId) query.outletId = outletId;

  return PrinterModel.find(query).populate('outletId', 'name code').sort({ createdAt: -1 });
};

export const updatePrinter = async (
  organizationId: string,
  userId: string,
  id: string,
  payload: UpdatePrinterInput
) => {
  if (payload.name !== undefined && !payload.name.trim()) {
    throw new ApiError(400, 'name cannot be empty');
  }

  const printer = await PrinterModel.findOneAndUpdate(
    { _id: id, organizationId },
    { ...payload, updatedBy: userId },
    { new: true, runValidators: true }
  );

  if (!printer) throw new ApiError(404, 'Printer not found');
  return printer;
};

export const softDeletePrinter = async (organizationId: string, userId: string, id: string) => {
  const printer = await PrinterModel.findOneAndUpdate(
    { _id: id, organizationId },
    { isActive: false, updatedBy: userId },
    { new: true }
  );
  if (!printer) throw new ApiError(404, 'Printer not found');
  return printer;
};

export const restorePrinter = async (organizationId: string, userId: string, id: string) => {
  const printer = await PrinterModel.findOneAndUpdate(
    { _id: id, organizationId },
    { isActive: true, updatedBy: userId },
    { new: true }
  );
  if (!printer) throw new ApiError(404, 'Printer not found');
  return printer;
};

export const hardDeletePrinter = async (organizationId: string, id: string) => {
  const printer = await PrinterModel.findOneAndDelete({ _id: id, organizationId });
  if (!printer) throw new ApiError(404, 'Printer not found');
  return printer;
};