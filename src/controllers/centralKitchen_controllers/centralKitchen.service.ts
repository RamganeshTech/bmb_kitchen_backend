import mongoose, { Types } from 'mongoose';
import { ApiError } from '../../utils/apiError.js';
import CentralKitchenTransferModel, { ITransferLine } from '../../models/centralKitchen_model/centralKitchen.model.js';
import { InventoryModel } from '../../models/inventory_model/Inventory.model.js';
import OutletModel from '../../models/outlet_models/outlet.model.js';

interface CreateTransferInput {
  fromOutletId: string;
  toOutletId: string;
  lines: { inventoryId: string; quantity: number }[];
}

const STAGE_ORDER = ['Requested', 'Approved', 'Dispatched', 'Received'] as const;
type TransferStatus = (typeof STAGE_ORDER)[number];

async function computeLinesValue(lines: { inventoryId: string; quantity: number }[]) {
  let value = 0;
  const preparedLines: ITransferLine[] = [];
  for (const line of lines) {
    const inventoryItem = await InventoryModel.findById(line.inventoryId).lean();
    if (!inventoryItem) {
      throw new ApiError(404, `Inventory item not found: ${line.inventoryId}`);
    }
    value += (inventoryItem.rate || 0) * line.quantity;
    preparedLines.push({
      inventoryId: new Types.ObjectId(line.inventoryId),
      quantity: line.quantity,
    } as ITransferLine);
  }
  return { preparedLines, value };
}

export const createTransfer = async (
  organizationId: string,
  userId: string,
  payload: CreateTransferInput
) => {
  const { fromOutletId, toOutletId, lines } = payload;

  if (fromOutletId === toOutletId) {
    throw new ApiError(400, 'Source and destination outlet must differ');
  }

  const [fromOutlet, toOutlet] = await Promise.all([
    OutletModel.findOne({ _id: fromOutletId, organizationId }),
    OutletModel.findOne({ _id: toOutletId, organizationId }),
  ]);
  if (!fromOutlet) throw new ApiError(404, 'From outlet not found');
  if (!toOutlet) throw new ApiError(404, 'To outlet not found');

  if (!lines || !lines.length) {
    throw new ApiError(400, 'At least one line item is required');
  }

  const { preparedLines, value } = await computeLinesValue(lines);

  const transfer = await CentralKitchenTransferModel.create({
    organizationId,
    fromOutletId,
    toOutletId,
    lines: preparedLines,
    value,
    status: 'Requested',
    createdBy: userId,
  });

  return transfer;
};

export const getTransferById = async (organizationId: string, id: string) => {
  const transfer = await CentralKitchenTransferModel.findOne({ _id: id, organizationId })
    .populate('fromOutletId', 'name code')
    .populate('toOutletId', 'name code')
    .populate('lines.inventoryId', 'material unit rate');
  if (!transfer) throw new ApiError(404, 'Transfer not found');
  return transfer;
};

export const listActiveTransfers = async (organizationId: string) => {
  return CentralKitchenTransferModel.find({ organizationId, isActive: true })
    .populate('fromOutletId', 'name code')
    .populate('toOutletId', 'name code')
    .sort({ createdAt: -1 });
};

export const listInactiveTransfers = async (organizationId: string) => {
  return CentralKitchenTransferModel.find({ organizationId, isActive: false })
    .populate('fromOutletId', 'name code')
    .populate('toOutletId', 'name code')
    .sort({ createdAt: -1 });
};

export const updateTransferStage = async (
  organizationId: string,
  userId: string,
  id: string,
  nextStatus: TransferStatus
) => {
  if (!STAGE_ORDER.includes(nextStatus)) {
    throw new ApiError(400, 'Invalid status');
  }

  const transfer = await CentralKitchenTransferModel.findOne({
    _id: id,
    organizationId,
    isActive: true,
  });
  if (!transfer) throw new ApiError(404, 'Transfer not found');

  const currentIdx = STAGE_ORDER.indexOf(transfer.status);
  const nextIdx = STAGE_ORDER.indexOf(nextStatus);

  if (nextIdx !== currentIdx + 1) {
    throw new ApiError(400, `Cannot move from ${transfer.status} to ${nextStatus}`);
  }

  // Stock only moves at Dispatched — Received is just a confirmation step
  if (nextStatus === 'Dispatched') {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const line of transfer.lines) {
          const inventoryItem = await InventoryModel.findOne({
            _id: line.inventoryId,
            organizationId,
          }).session(session);

          if (!inventoryItem) {
            throw new ApiError(404, `Inventory item not found: ${line.inventoryId}`);
          }
          if (inventoryItem.inStock < line.quantity) {
            throw new ApiError(
              400,
              `Insufficient stock for ${inventoryItem.material}: has ${inventoryItem.inStock}, needs ${line.quantity}`
            );
          }

          inventoryItem.inStock -= line.quantity;
          inventoryItem.value = inventoryItem.inStock * (inventoryItem.rate || 0);
          inventoryItem.updatedBy = new Types.ObjectId(userId);
          await inventoryItem.save({ session });
        }

        transfer.status = nextStatus;
        transfer.updatedBy = new Types.ObjectId(userId);
        await transfer.save({ session });
      });
    } finally {
      session.endSession();
    }
  } else {
    transfer.status = nextStatus;
    transfer.updatedBy = new Types.ObjectId(userId);
    await transfer.save();
  }

  return transfer;
};

export const softDeleteTransfer = async (organizationId: string, userId: string, id: string) => {
  const transfer = await CentralKitchenTransferModel.findOneAndUpdate(
    { _id: id, organizationId },
    { isActive: false, updatedBy: userId },
    { new: true }
  );
  if (!transfer) throw new ApiError(404, 'Transfer not found');
  return transfer;
};

export const restoreTransfer = async (organizationId: string, userId: string, id: string) => {
  const transfer = await CentralKitchenTransferModel.findOneAndUpdate(
    { _id: id, organizationId },
    { isActive: true, updatedBy: userId },
    { new: true }
  );
  if (!transfer) throw new ApiError(404, 'Transfer not found');
  return transfer;
};

export const hardDeleteTransfer = async (organizationId: string, id: string) => {
  const transfer = await CentralKitchenTransferModel.findOneAndDelete({ _id: id, organizationId });
  if (!transfer) throw new ApiError(404, 'Transfer not found');
  return transfer;
};