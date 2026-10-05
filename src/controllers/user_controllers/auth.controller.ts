import { type Request, type Response, type NextFunction } from "express";
import * as authService from "./auth.service.js";
import type { RoleBasedRequest } from "../../utils/utils.js";

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { name, email, password, role, organizationId } = req.body;

        if (!name || !email || !password || !role) {
            res.status(400).json({ ok: false, message: "All fields required" });
            return;
        }

        if (!organizationId) {
            res.status(400).json({ ok: false, message: "organizationId field is required" });
            return;
        }

        const { user, token } = await authService.registerUser(name, email, password, role, organizationId);

        res.status(201).json({ ok: true, token, data: user });
    } catch (error) {
        next(error);
    }
};

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ ok: false, message: "Email and password required" });
            return;
        }

        const { user, token } = await authService.loginUser(email, password);

        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            // sameSite: "lax",
            sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        // res.cookie(specificRefreshKey, refreshToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 });

        res.status(200).json({ ok: true, token, data: user });
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (
    req: RoleBasedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { organizationId } = req.user!;
        const { email, phoneNo, role, userName, isActive, page, limit } = req.query;

        const result = await authService.getAllUsers(organizationId, {
            email,
            phoneNo,
            role,
            userName,
            isActive: isActive === undefined ? undefined : isActive === "true",
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });

        res.status(200).json({ ok: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (
    req: RoleBasedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { userId } = req.params


        if (!userId) {
            res.status(400).json({ ok: false, message: "userId is required" });
            return;
        }

        const user = await authService.getByUserId(userId);

        res.status(200).json({ ok: true, data: user });
    } catch (error) {
        next(error);
    }
};



export const userAuthenticated = async (
    req: RoleBasedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { userId } = req.user!


        if (!userId) {
            res.status(400).json({ ok: false, message: "userId not found, please login" });
            return;
        }

        const user = await authService.getByUserId(userId);

        res.status(200).json({ ok: true, data: user });
    } catch (error) {
        next(error);
    }
};



export const logout = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        res
            .clearCookie("accessToken")
            .status(200)
            .json({
                ok: true,
                message: "Logged out successfully",
            });
    } catch (error) {
        next(error);
    }

};



export const forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ ok: false, message: "Email is required" });
            return;
        }

        await authService.forgotPassword(email);

        // Always generic — don't reveal whether the email exists
        res.status(200).json({
            ok: true,
            message: "If that email is registered, a reset link has been sent",
        });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (
    req: RoleBasedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { userId, token } = req.params;
        const { password } = req.body;


        if (!userId) {
            res.status(400).json({ ok: false, message: "userId is required" });
            return;
        }

        if (!token) {
            res.status(400).json({ ok: false, message: "token is missing, either generate one another reset password link and try resetting the password" });
            return;
        }

        if (!password) {
            res.status(400).json({ ok: false, message: "New password is required" });
            return;
        }

        await authService.resetPassword(userId, token, password);

        res.status(200).json({ ok: true, message: "Password reset successful" });
    } catch (error) {
        next(error);
    }
};


export const updateUserData = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, message: 'Unauthorized: User ID missing' });
    }

    // Explicitly destructure only allowed fields from body
    const { email, userName, phoneNo } = req.body;

    const updatedUser = await authService.updateUserData(userId, {
      email,
      userName,
      phoneNo,
    });

    return res.status(200).json({
      ok: true,
      message: 'User profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleUser = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ ok: false, message: "User ID is required" });
    }

    const user = await authService.getByUserId(userId);
    

    return res.status(200).json({
      ok: true,
      data: user?.user || null,
    });
  } catch (error) {
    next(error);
  }
};


export const updateProfileImage = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, userId } = req.params;
    const file = req.file;

    if (!organizationId) {
      res.status(400).json({ ok: false, message: "organizationId is required" });
      return;
    }
    if (!userId) {
      res.status(400).json({ ok: false, message: "userId is required" });
      return;
    }
    if (!file) {
      res.status(400).json({ ok: false, message: "file is required" });
      return;
    }

    const result = await authService.updateProfileImage(organizationId, userId, file);

    res.status(200).json({ ok: true, data: result, message: "Profile image updated successfully" });
  } catch (error) {
    next(error);
  }
};



export const updateUserPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params as { userId: string };
    const { permissions } = req.body;

    if (!userId) {
      res.status(400).json({ ok: false, message: 'User ID is required' });
      return;
    }

    if (!permissions || typeof permissions !== 'object' || Object.keys(permissions).length === 0) {
      res.status(400).json({
        ok: false,
        message: 'Permissions object with at least one module is required',
      });
      return;
    }

    const updatedUser = await authService.updateUserPermissions(userId, permissions);

    res.status(200).json({
      ok: true,
      message: 'Permissions updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};