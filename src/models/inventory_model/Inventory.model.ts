import { Schema, model, Document, Types } from 'mongoose';

/**
 * Common units of measure for restaurant inventory.
 * Extend as needed (e.g. 'sachet', 'can', 'bottle').
 */
export type InventoryUnit = 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'packet' | 'box' | 'dozen';

export interface IInventory extends Document {
    organizationId: Types.ObjectId;
    inventoryNo: string;
    material: string;
    category: string;
    unit: InventoryUnit;
    inStock: number;
    minLevel: number;
    rate: number;
    value: number;
    vendorId?: Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: Types.ObjectId;
    updatedBy?: Types.ObjectId;
}

const inventorySchema = new Schema<IInventory>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'OrganizationModel',
            required: true,
        },
        inventoryNo: {
            type: String,
            // uniqueness is enforced per-organization by the compound index below,
            // not globally — do not mark `unique: true` here.
        },
        material: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            trim: true,
        },
        unit: {
            type: String,
            enum: ['kg', 'g', 'l', 'ml', 'pcs', 'packet', 'box', 'dozen'],
            required: true,
        },
        inStock: {
            type: Number,
            default: 0,
            min: 0,
        },
        minLevel: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        rate: {
            type: Number,
            required: true,
            min: 0,
        },
        value: {
            // kept in sync automatically: inStock * rate. Not set directly by callers.
            type: Number,
            default: 0,
            min: 0,
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: 'VendorModel',
              default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'UserModel',
            required: true,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'UserModel',
            default: null,
        },
    },
    { timestamps: true }
);

// inventoryNo unique per organization (not globally)
inventorySchema.index({ organizationId: 1, inventoryNo: 1 }, { unique: true });
// material name unique per organization — remove this if the same material
// name should be allowed twice under different categories/vendors
// inventorySchema.index({ organizationId: 1, material: 1 }, { unique: true });

// Auto-generate inventoryNo (e.g. INV-001) per organization,
// and keep `value` in sync with inStock * rate
inventorySchema.pre('save', async function (this: IInventory) {
    if (!this.isNew) {
        if (this.isModified('inStock') || this.isModified('rate')) {
            this.value = this.inStock * this.rate;
        }
        return;
    }

    const prefix = 'INV-';

    const lastItem = await InventoryModel.findOne({
        organizationId: this.organizationId,
        inventoryNo: { $regex: `^${prefix}` },
    })
        .sort({ createdAt: -1 })
        .select('inventoryNo')
        .lean();

    let nextNumber = 1;

    if (lastItem?.inventoryNo) {
        const lastNumberStr = lastItem.inventoryNo.split('-').pop();
        const lastNumber = parseInt(lastNumberStr || '0', 10);
        nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
    }

    const paddedNumber = String(nextNumber).padStart(3, '0');
    this.inventoryNo = `${prefix}${paddedNumber}`;

    this.value = this.inStock * this.rate;
});

// Convenience virtual — true once stock has dropped to/below the reorder level
inventorySchema.virtual('isLowStock').get(function (this: IInventory) {
    return this.inStock <= this.minLevel;
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

export const InventoryModel = model<IInventory>('Inventory', inventorySchema);