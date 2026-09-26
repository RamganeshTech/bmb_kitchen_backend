import { ApiError } from "../../utils/apiError.js";

export type ReportScope = 'today' | 'week' | 'month' | 'year' | 'custom';

export function resolveDateRange(scope: ReportScope | undefined, from?: string, to?: string) {
  const now = new Date();

  // Explicit custom range always wins when both dates are supplied
  if (scope === 'custom' || (from && to)) {
    if (!from || !to) {
      throw new ApiError(400, 'Both from and to are required for a custom date range');
    }
    const start = new Date(`${from}T00:00:00.000`);
    const end = new Date(`${to}T23:59:59.999`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, 'from and to must be valid dates (YYYY-MM-DD)');
    }
    if (start > end) {
      throw new ApiError(400, 'from date must be before to date');
    }
    return { start, end };
  }

  switch (scope) {
    case 'week': {
      // rolling last 7 days, matching the HTML's "Last 7 days" spark chart
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'today':
    default: {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  }
}