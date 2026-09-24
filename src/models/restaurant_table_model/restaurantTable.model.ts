import { Schema, model, Document, Types } from 'mongoose';

export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface IReservation {
  customerName: string;
  phone?: string;
  reservationTime: Date;
  notes?: string;
}

export interface ITable extends Document {
  organizationId: Types.ObjectId;
  outletId: Types.ObjectId;
  tableNo: string;
  tableName: string;
  capacity: number;
  location?: string; // e.g., "Main Hall", "Patio", "Window"
  status: TableStatus;
  currentReservation?: IReservation | null;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<IReservation>(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    reservationTime: { type: Date, required: true },
    notes: { type: String, trim: true },
  },
  { _id: false } // No need for a separate ID for this embedded document
);

const tableSchema = new Schema<ITable>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    outletId: {
      type: Schema.Types.ObjectId,
      ref: 'OutletModel',
      required: [true, 'outlet ID is required'],
    },
    tableNo: { type: String, trim: true, },
    tableName: { type: String, trim: true, required: true },
    capacity: {
      type: Number,
      required: [true, 'Table capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Dining',
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved'],
      default: 'available',
      index: true,
    },
    currentReservation: {
      type: reservationSchema,
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
  {
    timestamps: true,
  }
);

// Compound unique index ensuring tableNo is unique per organization
tableSchema.index({ organizationId: 1 });
// Auto-generate tableNo (e.g. TBL-001) per organization
tableSchema.pre('save', async function (this: ITable) {
  if (!this.isNew) {
    return;
  }

  const prefix = 'TBL-';

  const lastTable = await RestaurantTableModel.findOne({
    organizationId: this.organizationId,
    tableNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('tableNo')
    .lean();

  let nextNumber = 1;

  if (lastTable?.tableNo) {
    const lastNumberStr = lastTable.tableNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  const paddedNumber = String(nextNumber).padStart(3, '0');
  this.tableNo = `${prefix}${paddedNumber}`;
});

// Middleware to clean up reservation details when status changes from 'reserved' to something else
tableSchema.pre('save', async function (this: ITable) {
  if (this.isModified('status') && this.status !== 'reserved') {
    this.currentReservation = null;
  }
  // No need for next() when using async functions in Mongoose
});

const RestaurantTableModel = model<ITable>('RestaurantTable', tableSchema);

export default RestaurantTableModel;