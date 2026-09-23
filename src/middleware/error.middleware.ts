import { type Request, type Response,type  NextFunction } from "express";
import { ApiError } from "../utils/apiError.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      ok: false,
      message: err.message,
    });
    return;
  }

  // Unexpected errors — don't leak details to client
  console.error("Unexpected Error:", err);
  res.status(500).json({
    ok: false,
    message: "Internal server error",
  });
};