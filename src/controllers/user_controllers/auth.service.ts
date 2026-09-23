import jwt from "jsonwebtoken";
import { Types } from "mongoose"
import bcrypt from "bcryptjs";
import type { IActionPermission, IRole, IUser } from "../../models/user_models/user.model.js";
import UserModel from "../../models/user_models/user.model.js";
import { ApiError } from "../../utils/apiError.js";
import crypto from "crypto";
import { sendResetPasswordEmail } from "../../utils/mail_services/fogotPasswordmailer.js";


const SALT_ROUNDS = 12;

export const hashPassword = async (
    password: string
): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

export const generateToken = ({ userId, userName, email, role, organizationId }: { userId: string, userName: string, email: string, role: string, organizationId: string }): string => {
    const secret = process.env.JWT_SECRET!;
    return jwt.sign({ userId: userId, userName, email, role, organizationId }, secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    } as jwt.SignOptions);
};

export const registerUser = async (
    name: string,
    email: string,
    password: string,
    role: string,
    organizationId: Types.ObjectId
): Promise<{ user: IUser; token: string }> => {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "Email already registered");
    }

    const hashedPassword = await hashPassword(password);


    const user = await UserModel.create({ userName: name, email, password: hashedPassword, organizationId });
    const token = generateToken({ userId: user._id.toString(), email, role, userName: name, organizationId: user.organizationId.toString() });

    return { user, token };
};


export const getByUserId = async (userId: string): Promise<{ user: IUser }> => {

    const user = await UserModel.findById(userId).select("-password")

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    return { user: user }
}

export const loginUser = async (
    email: string,
    password: string
): Promise<{ user: IUser; token: string }> => {
    // Explicitly select password since it's excluded by default
    const user = await UserModel.findOne({ email }).select("+password").populate("organizationId", "_id name contactEmail phone isActive");
    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (!user.isActive) {
        throw new ApiError(403, "Account is deactivated");
    }

    //   const isPasswordValid = await user.comparePassword(password);
    const isPasswordValid = await comparePassword(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    //   const token = generateToken(user._id.toString());
    const token = generateToken({ userId: user._id.toString(), email, role: user.role, userName: user.userName, organizationId: user.organizationId.toString() });

    return { user, token };
};



export const forgotPassword = async (email: string): Promise<void> => {
    const user = await UserModel.findOne({ email });

    // Don't throw if not found — respond the same way either way (avoids
    // leaking which emails are registered). Controller sends a generic
    // success message regardless.
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${user._id}/${rawToken}`;

    await sendResetPasswordEmail(user.email!, resetLink, user.userName);
};

export const resetPassword = async (
    userId: string,
    token: string,
    newPassword: string
): Promise<{ user: IUser }> => {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
        _id: userId,
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
        throw new ApiError(400, "Invalid or expired reset link");
    }

    user.password = await hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return { user };
};



export interface UserFilters {
    email?: string;
    phoneNo?: string;
    role?: IRole | string |  undefined;
    userName?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

export const getAllUsers = async (
    organizationId: string,
    filters: UserFilters
): Promise<{ users: IUser[]; total: number; page: number; limit: number }> => {
    const { email, phoneNo, role, userName, isActive, page = 1, limit = 20 } = filters;

    const query: Record<string, any> = { organizationId };

    // partial, case-insensitive match for text fields
    if (email) query.email = { $regex: email, $options: "i" };
    if (phoneNo) query.phoneNo = { $regex: phoneNo, $options: "i" };
    if (userName) query.userName = { $regex: userName, $options: "i" };

    // exact match for enum / boolean fields
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        UserModel.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        UserModel.countDocuments(query),
    ]);

    return { users, total, page, limit };
};

export const updateUserPermissions = async (
  userId: string,
  incomingPermissions: Record<string, Partial<IActionPermission>>
): Promise<IUser> => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Build the dynamic MongoDB dot-notation update object:
  // e.g. { "permission.menu.create": true, "permission.menu.get": false }
  const updateFields: Record<string, boolean> = {};

  for (const [moduleName, actions] of Object.entries(incomingPermissions)) {
    if (!actions || typeof actions !== 'object') continue;

    for (const [action, value] of Object.entries(actions)) {
      if (typeof value === 'boolean') {
        updateFields[`permission.${moduleName}.${action}`] = value;
      }
    }
  }

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, 'No valid permission fields provided to update');
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select('-password');

  if (!updatedUser) {
    throw new ApiError(404, 'User not found');
  }

  return updatedUser;
};