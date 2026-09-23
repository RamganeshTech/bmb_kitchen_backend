export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};


import { type Request } from "express";
import type { IRole } from "../models/user_models/user.model.js";

// export interface RoleBasedRequest extends Request {

//   user?: {
//     userId: string;
//     organizationId: string;
//     role: IRole;
//     userName: string;
//   };
// }

export interface RoleBasedRequest extends Request {
  params: Record<string, string>;
  query: Record<string, string | undefined>;

  user?: {
    userId: string;
    organizationId: string;
    role: IRole;
    userName: string;
  };
}



export const pickFields = <T extends Record<string, any>>(
  source: Record<string, any>,
  allowedFields: (keyof T)[]
): Partial<T> => {
  const result: Partial<T> = {};

  for (const field of allowedFields) {
    if (source[field as string] !== undefined) {
      result[field] = source[field as string];
    }
  }

  return result;
};