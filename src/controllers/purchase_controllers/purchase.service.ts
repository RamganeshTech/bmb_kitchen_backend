import mongoose, { Types } from 'mongoose';
// import PurchaseModel, { IPurchase, IPurchaseItem } from './purchase.model.js';
// import { InventoryModel } from '../inventory/inventory.model.js';
import { ApiError } from '../../utils/apiError.js';
import PurchaseModel, { IPurchase, IPurchaseItem } from '../../models/purchase_model/purchase.model.js';
import { InventoryModel } from '../../models/inventory_model/Inventory.model.js';

interface CreatePurchaseInput {
    vendorId: string | Types.ObjectId;
    items: Pick<IPurchaseItem, 'inventoryId' | 'quantity' | 'rate'>[];
    paymentStatus?: IPurchase['paymentStatus'];
}

// ── CREATE (transactional: purchase record + inventory stock bump) ─
export const createPurchase = async (
    organizationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    data: CreatePurchaseInput
): Promise<IPurchase> => {
    const session = await mongoose.startSession();

    try {
        let purchase!: IPurchase;

        await session.withTransaction(async () => {
            const [created] = await PurchaseModel.create(
                [
                    {
                        organizationId,
                        vendorId: data.vendorId,
                        items: data.items,
                        paymentStatus: data.paymentStatus,
                        createdBy: userId,
                    },
                ],
                { session }
            );

            if (!created) {
                throw new Error('Failed to create purchase record');
            }

            purchase = created;

            for (const item of data.items) {
                const inventoryItem = await InventoryModel.findOne({
                    _id: item.inventoryId,
                    organizationId,
                }).session(session);

                if (!inventoryItem) {
                    throw new ApiError(404, `Inventory item ${item.inventoryId} not found`);
                }

                inventoryItem.inStock += item.quantity;
                inventoryItem.value = inventoryItem.inStock * inventoryItem.rate;
                await inventoryItem.save({ session });
            }
        });

        return purchase;
    } finally {
        session.endSession();
    }
};

// ── LIST (active, full detail) ───────────────────────────────────
export const getPurchaseList = async (
    organizationId: string | Types.ObjectId
): Promise<IPurchase[]> => {
    const purchases = await PurchaseModel.find({ organizationId, isActive: true })
        .populate('vendorId', 'vendorName')
        .populate('items.inventoryId', 'material rate')
        .sort({ createdAt: -1 });

    return purchases;
};

// ── LIST (inactive / soft-deleted, full detail) ──────────────────
export const getInactivePurchaseList = async (
    organizationId: string | Types.ObjectId
): Promise<IPurchase[]> => {
    const purchases = await PurchaseModel.find({ organizationId, isActive: false })
        .populate('vendorId', 'vendorName')
        .populate('items.inventoryId', 'material rate')
        .sort({ updatedAt: -1 });

    return purchases;
};

// ── GET BY ID ─────────────────────────────────────────────────────
export const getPurchaseById = async (
    organizationId: string | Types.ObjectId,
    purchaseId: string | Types.ObjectId
): Promise<IPurchase> => {
    const purchase = await PurchaseModel.findOne({ _id: purchaseId, organizationId })
        .populate('vendorId', 'vendorName')
        .populate('items.inventoryId', 'material rate');

    if (!purchase) {
        throw new ApiError(404, 'Purchase not found');
    }

    return purchase;
};

// ── UPDATE ────────────────────────────────────────────────────────
// Note: only updates the purchase record itself (e.g. paymentStatus).
// It does NOT re-adjust inventory stock if items/quantities change —
// that needs an explicit reversal + re-apply flow, not a plain field update.
export const updatePurchase = async (
    organizationId: string | Types.ObjectId,
    purchaseId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    data: Partial<Pick<IPurchase, 'paymentStatus'>>
): Promise<IPurchase> => {
    const purchase = await PurchaseModel.findOneAndUpdate(
        { _id: purchaseId, organizationId },
        { ...data, updatedBy: userId },
        { new: true, runValidators: true }
    );

    if (!purchase) {
        throw new ApiError(404, 'Purchase not found');
    }

    return purchase;
};

// ── SOFT DELETE (isActive: false) ─────────────────────────────────
export const softDeletePurchase = async (
    organizationId: string | Types.ObjectId,
    purchaseId: string | Types.ObjectId,
    userId: string | Types.ObjectId
): Promise<IPurchase> => {
    const purchase = await PurchaseModel.findOneAndUpdate(
        { _id: purchaseId, organizationId },
        { isActive: false, updatedBy: userId },
        { new: true }
    );

    if (!purchase) {
        throw new ApiError(404, 'Purchase not found');
    }

    return purchase;
};

// ── RESTORE (isActive: false → true) ──────────────────────────────
export const restorePurchase = async (
    organizationId: string | Types.ObjectId,
    purchaseId: string | Types.ObjectId,
    userId: string | Types.ObjectId
): Promise<IPurchase> => {
    const purchase = await PurchaseModel.findOneAndUpdate(
        { _id: purchaseId, organizationId },
        { isActive: true, updatedBy: userId },
        { new: true }
    );

    if (!purchase) {
        throw new ApiError(404, 'Purchase not found');
    }

    return purchase;
};

// ── HARD DELETE (permanent) ───────────────────────────────────────
export const hardDeletePurchase = async (
    organizationId: string | Types.ObjectId,
    purchaseId: string | Types.ObjectId
): Promise<void> => {
    const purchase = await PurchaseModel.findOneAndDelete({
        _id: purchaseId,
        organizationId,
    });

    if (!purchase) {
        throw new ApiError(404, 'Purchase not found');
    }
};