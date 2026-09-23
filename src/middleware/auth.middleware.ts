

import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import type { RoleBasedRequest } from "../utils/utils.js";
import type { IRole } from "../models/user_models/user.model.js";

interface JwtPayload {
  userId: string;
  organizationId: string;
  role: IRole;
  userName: string;
}

const extractToken = (req: Request): string | null | undefined => {
  if (req.cookies?.["accessToken"]) {
    return req.cookies["accessToken"];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
};

export const multiAuthRole = (...roles: IRole[]) => {
  return async (
    req: RoleBasedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // ── 1. CHECK TOKEN ──────────────────────────────────────────
      const token = extractToken(req);
      if (!token) throw new ApiError(401, "Not authorized — no token provided");

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as JwtPayload;

      

      req.user = {
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        role: decoded.role,
        userName: decoded.userName,
      };

      // ── 2. CHECK ROLE (only if roles are passed) ────────────────
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        throw new ApiError(403, "Access denied — insufficient permissions");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};