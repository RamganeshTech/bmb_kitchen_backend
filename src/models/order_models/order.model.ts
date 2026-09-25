import { Schema, model, Document, Types } from 'mongoose';

export type ItemKitchenStatus =
  | 'in_queue'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'cancelled';

export type OrderStatus = 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'partially_paid';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'split' | 'unpaid';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'online';

export interface IOrderItem {
  _id?: Types.ObjectId;
  menuItemId: Types.ObjectId;
  name: string; // Snapshot at the time of order
  price: number; // Snapshot base price
  quantity: number;
  itemTotal: number;
  notes?: string; // e.g. "extra spicy", "no onions"
  status: ItemKitchenStatus;
  sentToKitchenAt: Date;
  readyAt?: Date;
  servedAt?: Date;
}

export interface IOrder extends Document {
  organizationId: Types.ObjectId;
  outletId: Types.ObjectId;
  orderNo: string; // Auto-generated order sequence (e.g., ORD-0001)
  billNo?: string; // Generated upon final bill printing / completion

  tableId?: Types.ObjectId; // Reference to RestaurantTable (if dine_in)
  orderType: OrderType;

  customerId?: Types.ObjectId;

  items: IOrderItem[];

  loyaltyPointsRedeemed: number;
  // Billing calculations
  subTotal: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;

  // Lifecycle & payment states
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paidAt?: Date;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItemModel',
      required: [true, 'Menu Item ID is required'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    itemTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['in_queue', 'preparing', 'ready', 'served', 'cancelled'],
      default: 'in_queue',
    },
    sentToKitchenAt: {
      type: Date,
      default: Date.now,
    },
    readyAt: {
      type: Date,
    },
    servedAt: {
      type: Date,
    },
  },
  { _id: true }
);

const orderSchema = new Schema<IOrder>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: [true, 'Organization ID is required'],
    },

    outletId: {
      type: Schema.Types.ObjectId,
      ref: 'OutletModel',
      required: [true, 'outlet ID is required'],
    },

    orderNo: {
      type: String,
      required: true,
      trim: true,
    },
    billNo: {
      type: String,
      trim: true,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'RestaurantTable',
      index: true,
      default: null
    },
    orderType: {
      type: String,
      enum: ['dine_in', 'takeaway', 'delivery', "online"],
      default: 'dine_in',
    },
    loyaltyPointsRedeemed: {
      type: Number,
      default: 0,
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer', // Link to the new Customer model
      default: null
    },
    items: [orderItemSchema],

    // Calculations
    subTotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxPercent: {
      type: Number,
      default: 5, // e.g. 5% GST
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Statuses
    orderStatus: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      // index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partially_paid'],
      default: 'pending',
      // index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'split', 'unpaid'],
      default: 'unpaid',
    },
    paidAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserModel',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserModel',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate orderNo (e.g. ORD-2026-0001) per organization
orderSchema.pre('save', async function (this: IOrder) {
  if (!this.isNew) {
    return;
  }

  if (this.orderNo) {
    return;
  }

  const currentYear = new Date().getFullYear();
  const prefix = `ORD-${currentYear}-`;

  const lastOrder = await OrderModel.findOne({
    organizationId: this.organizationId,
    orderNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('orderNo')
    .lean();

  let nextNumber = 1;

  if (lastOrder?.orderNo) {
    const lastNumberStr = lastOrder.orderNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  const paddedNumber = String(nextNumber).padStart(4, '0');
  this.orderNo = `${prefix}${paddedNumber}`;
});

// Compound index to ensure uniqueness of order numbers per organization
orderSchema.index({ organizationId: 1, orderNo: 1, customerId: 1 });

const OrderModel = model<IOrder>('Order', orderSchema);

export default OrderModel;