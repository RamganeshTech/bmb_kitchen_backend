import jwt from "jsonwebtoken";
import { Types } from "mongoose"
import bcrypt from "bcryptjs";
import type { IActionPermission, IRole, IUser } from "../../models/user_models/user.model.js";
import UserModel from "../../models/user_models/user.model.js";
import { ApiError } from "../../utils/apiError.js";
import crypto from "crypto";
import { sendResetPasswordEmail } from "../../utils/mail_services/fogotPasswordmailer.js";
import { uploadFileToS3 } from "../../utils/s3Upload.js";


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
): Promise<{ user: IUser }> => {
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  const hashedPassword = await hashPassword(password);


  const user = await UserModel.create({ userName: name, email, password: hashedPassword, organizationId });
  // const token = generateToken({ userId: user._id.toString(), email, role, userName: name, organizationId: user.organizationId.toString() });

  return { user };
};


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
  const token = generateToken({ userId: user._id.toString(), email, role: user.role, userName: user.userName, organizationId: user.organizationId?._id.toString() });

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




export const getByUserId = async (userId: string): Promise<{ user: IUser }> => {

  const user = await UserModel.findById(userId).populate("organizationId", "_id name logo").select("-password")

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  return { user: user }
}


export interface UserFilters {
  email?: string;
  phoneNo?: string;
  role?: IRole | string | undefined;
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



export interface UpdateUserDataInput {
  email?: string;
  userName?: string;
  phoneNo?: string;
}

export const updateUserData = async (userId: string, input: UpdateUserDataInput) => {
  // Whitelist: strictly extract and sanitize only the permitted fields
  const updatePayload: Record<string, string> = {};

  if (typeof input.userName === 'string') {
    const trimmed = input.userName.trim();
    if (!trimmed) {
      throw new ApiError(400, 'User name cannot be empty');
    }
    updatePayload.userName = trimmed;
  }

  if (typeof input.email === 'string') {
    const trimmed = input.email.trim().toLowerCase();
    // Check for email collision if changed and not empty
    if (trimmed) {
      const existingUser = await UserModel.findOne({
        email: trimmed,
        _id: { $ne: userId },
      });
      if (existingUser) {
        throw new ApiError(409, 'Email is already in use by another account');
      }
    }
    updatePayload.email = trimmed;
  }

  if (typeof input.phoneNo === 'string') {
    updatePayload.phoneNo = input.phoneNo.trim();
  }

  if (Object.keys(updatePayload).length === 0) {
    throw new ApiError(400, 'No valid fields provided for update');
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: updatePayload },
    { new: true, runValidators: true }
  ).select('-password');

  if (!updatedUser) {
    throw new ApiError(404, 'User not found');
  }

  return updatedUser;
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



export const updateProfileImage = async (
  organizationId: string,
  userId: string,
  file: Express.Multer.File
): Promise<{ user: IUser }> => {
  if (!file.mimetype.startsWith("image/")) {
    throw new ApiError(400, "Only image files are allowed for profile image");
  }

  const user = await UserModel.findOne({ _id: userId, organizationId });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const uploadedData = await uploadFileToS3(file);

  user.profileImage = {
    type: "image",
    key: uploadedData.key,
    url: uploadedData.url,
    originalName: uploadedData.originalName,
    uploadedAt: uploadedData.uploadedAt,
  };

  await user.save();

  return { user };
};


export const updateUserRole = async (
  userId: string,
  organizationId: string,
  role: string
): Promise<{ user: IUser; message: string }> => {
  const user = await UserModel.findOneAndUpdate(
    { _id: userId, organizationId },
    { $set: { role } },
    { new: true }
  )
    .select("-password");

  if (!user) {
    throw new ApiError(404, "User not found or not in your organization");
  }

  return { user, message: "User role updated successfully" };
};

export const deleteUserById = async (userId: string): Promise<{ message: string }> => {
  const user = await UserModel.findByIdAndDelete(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return { message: "User deleted successfully" };
};




export interface InactiveUserFilters {
  email?: string;
  phoneNo?: string;
  role?: string;
  userName?: string;
  page?: number;
  limit?: number;
}

// 1. Soft Delete (Deactivate)
export const softDeleteUser = async (
  userId: string,
  organizationId: string
): Promise<{ message: string }> => {
  const user = await UserModel.findOneAndUpdate(
    { _id: userId, organizationId },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found or not in your organization");
  }

  return { message: "User deactivated successfully" };
};

// 2. Recover User (Reactivate)
export const recoverUser = async (
  userId: string,
  organizationId: string
): Promise<{ message: string }> => {
  const user = await UserModel.findOneAndUpdate(
    { _id: userId, organizationId },
    { $set: { isActive: true } },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found or not in your organization");
  }

  return { message: "User reactivated successfully" };
};
