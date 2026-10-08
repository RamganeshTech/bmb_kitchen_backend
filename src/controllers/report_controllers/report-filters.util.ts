// import { ApiError } from "../../utils/apiError.js";

import { IST_OFFSET_MS } from "../../constants/constants.js";
import { ApiError } from "../../utils/apiError.js";
import { DAY_MS } from "../../utils/dateRange.js";

// export type ReportScope = 'today' | 'week' | 'month' | 'year' | 'custom';




// export function resolveDateRange(scope: ReportScope | undefined, from?: string, to?: string) {
//   const now = new Date();

//   // Explicit custom range always wins when both dates are supplied
//   // if (scope === 'custom' || (from && to)) {
//   //   if (!from || !to) {
//   //     throw new ApiError(400, 'Both from and to are required for a custom date range');
//   //   }
//   //   const start = new Date(`${from}T00:00:00.000`);
//   //   const end = new Date(`${to}T23:59:59.999`);
//   //   if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//   //     throw new ApiError(400, 'from and to must be valid dates (YYYY-MM-DD)');
//   //   }
//   //   if (start > end) {
//   //     throw new ApiError(400, 'from date must be before to date');
//   //   }
//   //   return { start, end };
//   // }

//   if (scope === 'custom') {
//     if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
//       throw new ApiError(400, 'from and to must be valid dates (YYYY-MM-DD)');
//     }

//     // Parse as local time (not UTC) so IST days don't shift by 5h30m
//     const start = new Date(`${from}T00:00:00`);
//     const end = new Date(`${to}T23:59:59.999`);

//     if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
//       throw new ApiError(400, 'from and to must be valid dates (YYYY-MM-DD), and from cannot be after to');
//     }
//     return { start, end };
//   }

//   switch (scope) {
//     case 'week': {
//       // rolling last 7 days, matching the HTML's "Last 7 days" spark chart
//       const start = new Date(now);
//       start.setDate(now.getDate() - 6);
//       start.setHours(0, 0, 0, 0);
//       const end = new Date(now);
//       end.setHours(23, 59, 59, 999);
//       return { start, end };
//     }
//     case 'month': {
//       const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
//       const end = new Date(now);
//       end.setHours(23, 59, 59, 999);
//       return { start, end };
//     }
//     case 'year': {
//       const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
//       const end = new Date(now);
//       end.setHours(23, 59, 59, 999);
//       return { start, end };
//     }
//     case 'today':
//     default: {
//       const start = new Date(now);
//       start.setHours(0, 0, 0, 0);
//       const end = new Date(now);
//       end.setHours(23, 59, 59, 999);
//       return { start, end };
//     }
//   }
// }



//  NEW VERSION

export type ReportScope = 'today' | 'week' | 'month' | 'year' | 'custom';

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

// Start of the IST day that contains `date`, returned as a real UTC instant
const startOfDayIST = (date: Date = new Date()): Date => {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
};

// 'YYYY-MM-DD' -> start of that day in IST (null if invalid)
export const parseDateIST = (value?: string): Date | null => {
  if (!value || !DATE_FORMAT.test(value)) return null;
  // const [y, m, d] = value.split('-').map(Number);
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(y, m - 1, d));
  if (utc.getUTCFullYear() !== y || utc.getUTCMonth() !== m - 1 || utc.getUTCDate() !== d) return null;
  return new Date(utc.getTime() - IST_OFFSET_MS);
};


// today's date in IST as 'YYYY-MM-DD'
export const todayIST = (): string =>
  new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);

export const resolveDateRange = (
  scope: 'today' | 'week' | 'month' | 'year' | 'custom' | undefined,
  from?: string,
  to?: string,
) => {
  const now = new Date();
  const todayStart = startOfDayIST(now);
  const shifted = new Date(now.getTime() + IST_OFFSET_MS); // only read with getUTC* methods

  switch (scope) {
    case 'week': {
      const daysSinceMonday = (shifted.getUTCDay() + 6) % 7;
      const start = new Date(todayStart.getTime() - daysSinceMonday * DAY_MS);
      return { start, end: new Date(start.getTime() + 7 * DAY_MS - 1) };
    }
    case 'month': {
      const y = shifted.getUTCFullYear();
      const m = shifted.getUTCMonth();
      return {
        start: new Date(Date.UTC(y, m, 1) - IST_OFFSET_MS),
        end: new Date(Date.UTC(y, m + 1, 1) - IST_OFFSET_MS - 1),
      };
    }
    case 'year': {
      const y = shifted.getUTCFullYear();
      return {
        start: new Date(Date.UTC(y, 0, 1) - IST_OFFSET_MS),
        end: new Date(Date.UTC(y + 1, 0, 1) - IST_OFFSET_MS - 1),
      };
    }
    case 'custom': {
      const start = parseDateIST(from);
      const toStart = parseDateIST(to);
      if (!start || !toStart || start > toStart) {
        throw new ApiError(400, 'from and to must be valid dates (YYYY-MM-DD), and from cannot be after to');
      }
      return { start, end: new Date(toStart.getTime() + DAY_MS - 1) };
    }
    default:
      return { start: todayStart, end: new Date(todayStart.getTime() + DAY_MS - 1) };
  }
};