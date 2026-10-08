import { IST_OFFSET_MS } from "../constants/constants.js";

export const DAY_MS = 24 * 60 * 60 * 1000;

// Start of the IST day that contains `date`
export const startOfDayIST = (date: Date = new Date()): Date => {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
};