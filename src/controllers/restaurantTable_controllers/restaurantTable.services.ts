// import RestaurantTableModel, { IReservation, ITable, TableStatus } from '../../models/restaurant_table_model/restaurantTable.model.js';
// import { ApiError } from '../../utils/apiError.js';
// import type { Types } from 'mongoose';

// // ── CREATE ────────────────────────────────────────────────────────
// export const createTable = async (
//   organizationId: string | Types.ObjectId,
//   userId: string | Types.ObjectId,
//   data: { capacity: number; location?: string }
// ): Promise<ITable> => {
//   const table = await RestaurantTableModel.create({
//     ...data,
//     organizationId,
//     createdBy: userId,
//   });

//   return table;
// };

// // ── GET ALL ACTIVE ────────────────────────────────────────────────
// export const getAllActiveTables = async (
//   organizationId: string | Types.ObjectId
// ): Promise<ITable[]> => {
//   return RestaurantTableModel.find({ organizationId, isActive: true }).sort({ tableNo: 1 });
// };

// // ── GET ALL INACTIVE ──────────────────────────────────────────────
// export const getAllInactiveTables = async (
//   organizationId: string | Types.ObjectId
// ): Promise<ITable[]> => {
//   return RestaurantTableModel.find({ organizationId, isActive: false }).sort({ tableNo: 1 });
// };

// // ── GET SINGLE BY ID ──────────────────────────────────────────────
// export const getTableById = async (
//   organizationId: string | Types.ObjectId,
//   tableId: string
// ): Promise<ITable> => {
//   const table = await RestaurantTableModel.findOne({ _id: tableId, organizationId });
//   if (!table) throw new ApiError(404, 'Table not found');
//   return table;
// };

// // ── GET DROPDOWN (ID, NO, CAPACITY, STATUS) ───────────────────────
// export const getTableDropdown = async (
//   organizationId: string | Types.ObjectId
// ): Promise<Array<{ _id: Types.ObjectId; tableNo: string; capacity: number; status: string }>> => {
//   return RestaurantTableModel.find({ organizationId, isActive: true })
//     .select('_id tableNo capacity status')
//     .sort({ tableNo: 1 })
//     .lean();
// };

// // ── UPDATE (DETAILS) ──────────────────────────────────────────────
// export const updateTableDetails = async (
//   organizationId: string | Types.ObjectId,
//   tableId: string,
//   userId: string | Types.ObjectId,
//   updates: Partial<Pick<ITable, 'capacity' | 'location'>>
// ): Promise<ITable> => {
//   const table = await RestaurantTableModel.findOneAndUpdate(
//     { _id: tableId, organizationId },
//     { $set: { ...updates, updatedBy: userId } },
//     { new: true, runValidators: true }
//   );

//   if (!table) throw new ApiError(404, 'Table not found');
//   return table;
// };

// // ── UPDATE STATUS (AVAILABLE / OCCUPIED) ──────────────────────────
// export const updateTableStatus = async (
//   organizationId: string | Types.ObjectId,
//   tableId: string,
//   userId: string | Types.ObjectId,
//   status: TableStatus
// ): Promise<ITable> => {
//   // Relying on the pre('save') hook to clear reservations if status shifts from 'reserved' to 'available'/'occupied'
//   const table = await RestaurantTableModel.findOne({ _id: tableId, organizationId });
//   if (!table) throw new ApiError(404, 'Table not found');

//   table.status = status;
//   table.updatedBy = userId as Types.ObjectId;
  
//   await table.save();
//   return table;
// };

// // ── RESERVE TABLE ─────────────────────────────────────────────────
// export const reserveTable = async (
//   organizationId: string | Types.ObjectId,
//   tableId: string,
//   userId: string | Types.ObjectId,
//   reservationData: IReservation
// ): Promise<ITable> => {
//   const table = await RestaurantTableModel.findOne({ _id: tableId, organizationId });
//   if (!table) throw new ApiError(404, 'Table not found');

//   if (table.status === 'occupied') {
//     throw new ApiError(409, 'Cannot reserve a table that is currently occupied');
//   }

//   table.status = 'reserved';
//   table.currentReservation = reservationData;
//   table.updatedBy = userId as Types.ObjectId;

//   await table.save();
//   return table;
// };

// // ── SOFT DELETE (DEACTIVATE) ──────────────────────────────────────
// export const softDeleteTable = async (
//   organizationId: string | Types.ObjectId,
//   tableId: string,
//   userId: string | Types.ObjectId
// ): Promise<void> => {
//   const table = await RestaurantTableModel.findOneAndUpdate(
//     { _id: tableId, organizationId },
//     { $set: { isActive: false, updatedBy: userId } }
//   );

//   if (!table) throw new ApiError(404, 'Table not found');
// };

// // ── RECOVER (ACTIVATE) ────────────────────────────────────────────
// export const recoverTable = async (
//   organizationId: string | Types.ObjectId,
//   tableId: string,
//   userId: string | Types.ObjectId
// ): Promise<void> => {
//   const table = await RestaurantTableModel.findOneAndUpdate(
//     { _id: tableId, organizationId },
//     { $set: { isActive: true, updatedBy: userId } }
//   );

//   if (!table) throw new ApiError(404, 'Table not found');
// };

// // ── HARD DELETE ───────────────────────────────────────────────────
// export const hardDeleteTable = async (
//   organizationId: string | Types.ObjectId,
//   tableId: string
// ): Promise<void> => {
//   const table = await RestaurantTableModel.findOneAndDelete({ _id: tableId, organizationId });
//   if (!table) throw new ApiError(404, 'Table not found');
// };






import RestaurantTableModel, { IReservation, ITable, TableStatus } from '../../models/restaurant_table_model/restaurantTable.model.js';
import { ApiError } from '../../utils/apiError.js';
import type { Types } from 'mongoose';

// ── CREATE ────────────────────────────────────────────────────────
export const createTable = async (
  organizationId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  data: { tableName: string; capacity: number; location?: string }
): Promise<ITable> => {
  const table = await RestaurantTableModel.create({
    ...data,
    organizationId,
    createdBy: userId,
  });

  return table;
};

// ── GET ALL ACTIVE ────────────────────────────────────────────────
export const getAllActiveTables = async (
  organizationId: string | Types.ObjectId
): Promise<ITable[]> => {
  return RestaurantTableModel.find({ organizationId, isActive: true }).sort({ tableNo: 1 });
};

// ── GET ALL INACTIVE ──────────────────────────────────────────────
export const getAllInactiveTables = async (
  organizationId: string | Types.ObjectId
): Promise<ITable[]> => {
  return RestaurantTableModel.find({ organizationId, isActive: false }).sort({ tableNo: 1 });
};

// ── GET SINGLE BY ID ──────────────────────────────────────────────
export const getTableById = async (
  organizationId: string | Types.ObjectId,
  tableId: string
): Promise<ITable> => {
  const table = await RestaurantTableModel.findOne({ _id: tableId, organizationId });
  if (!table) throw new ApiError(404, 'Table not found');
  return table;
};

// ── GET DROPDOWN (ID, NO, NAME, CAPACITY, STATUS) ─────────────────
export const getTableDropdown = async (
  organizationId: string | Types.ObjectId
): Promise<Array<{ _id: Types.ObjectId; tableNo: string; tableName: string; capacity: number; status: string }>> => {
  return RestaurantTableModel.find({ organizationId, isActive: true })
    .select('_id tableNo tableName capacity status')
    .sort({ tableNo: 1 })
    .lean();
};

// ── UPDATE (DETAILS) ──────────────────────────────────────────────
export const updateTableDetails = async (
  organizationId: string | Types.ObjectId,
  tableId: string,
  userId: string | Types.ObjectId,
  updates: Partial<Pick<ITable, 'tableName' | 'capacity' | 'location'>>
): Promise<ITable> => {
  const table = await RestaurantTableModel.findOneAndUpdate(
    { _id: tableId, organizationId },
    { $set: { ...updates, updatedBy: userId } },
    { new: true, runValidators: true }
  );

  if (!table) throw new ApiError(404, 'Table not found');
  return table;
};

// ── UPDATE STATUS (AVAILABLE / OCCUPIED) ──────────────────────────
export const updateTableStatus = async (
  organizationId: string | Types.ObjectId,
  tableId: string,
  userId: string | Types.ObjectId,
  status: TableStatus
): Promise<ITable> => {
  const table = await RestaurantTableModel.findOne({ _id: tableId, organizationId });
  if (!table) throw new ApiError(404, 'Table not found');

  table.status = status;
  table.updatedBy = userId as Types.ObjectId;
  
  await table.save();
  return table;
};

// ── RESERVE TABLE ─────────────────────────────────────────────────
export const reserveTable = async (
  organizationId: string | Types.ObjectId,
  tableId: string,
  userId: string | Types.ObjectId,
  reservationData: IReservation
): Promise<ITable> => {
  const table = await RestaurantTableModel.findOne({ _id: tableId, organizationId });
  if (!table) throw new ApiError(404, 'Table not found');

  if (table.status === 'occupied') {
    throw new ApiError(409, 'Cannot reserve a table that is currently occupied');
  }

  table.status = 'reserved';
  table.currentReservation = reservationData;
  table.updatedBy = userId as Types.ObjectId;

  await table.save();
  return table;
};

// ── SOFT DELETE (DEACTIVATE) ──────────────────────────────────────
export const softDeleteTable = async (
  organizationId: string | Types.ObjectId,
  tableId: string,
  userId: string | Types.ObjectId
): Promise<void> => {
  const table = await RestaurantTableModel.findOneAndUpdate(
    { _id: tableId, organizationId },
    { $set: { isActive: false, updatedBy: userId } }
  );

  if (!table) throw new ApiError(404, 'Table not found');
};

// ── RECOVER (ACTIVATE) ────────────────────────────────────────────
export const recoverTable = async (
  organizationId: string | Types.ObjectId,
  tableId: string,
  userId: string | Types.ObjectId
): Promise<void> => {
  const table = await RestaurantTableModel.findOneAndUpdate(
    { _id: tableId, organizationId },
    { $set: { isActive: true, updatedBy: userId } }
  );

  if (!table) throw new ApiError(404, 'Table not found');
};

// ── HARD DELETE ───────────────────────────────────────────────────
export const hardDeleteTable = async (
  organizationId: string | Types.ObjectId,
  tableId: string
): Promise<void> => {
  const table = await RestaurantTableModel.findOneAndDelete({ _id: tableId, organizationId });
  if (!table) throw new ApiError(404, 'Table not found');
};