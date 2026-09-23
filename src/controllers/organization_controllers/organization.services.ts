import mongoose, {Types} from "mongoose";
import type { IUser } from "../../models/user_models/user.model.js";
import UserModel from "../../models/user_models/user.model.js";
import { ApiError } from "../../utils/apiError.js";
import { generateToken, hashPassword } from "../user_controllers/auth.service.js";
import OrganizationModel, { IOrganization } from "../../models/organization/organization.model.js";

// ── CREATE ORG + OWNER USER (registration) ────────────────────────
export const createOrganization = async (
  userName: string,
  email: string,
  password: string,
  organizationName: string,
  phone?: string
): Promise<{ user: IUser; organizationId: Types.ObjectId }> => {

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) throw new ApiError(409, "Email already registered");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const hashedPassword = await hashPassword(password);

    // Step 1 — create org first
    const [organization] = await OrganizationModel.create(
      [{ name: organizationName, contactEmail: email, ...(phone ? { phone } : {}), }],
      { session }
    );


    if(!organization){
      throw new ApiError(500, "Organization not found")
    }

    // Step 2 — create owner user linked to org
    const [user] = await UserModel.create(
      [{
        userName,
        email,
        password: hashedPassword,
        // phone,
        ...(phone ? { phone } : {}),
        role: "owner",
        organizationId: organization._id,
      }],
      { session }
    );


    if (!user) throw new ApiError(500, "Failed to create user");

    // Step 3 — update org with ownerId now that user exists
    organization.ownerId = user!._id;
    await organization.save({ session });

    await session.commitTransaction();

    // const token = generateToken({
    //   userId: user._id.toString(),
    //   userName,
    //   email,
    //   role: "owner",
    //   organizationId: organization._id.toString(),
    // });

    return { user, organizationId: organization._id };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ── GET ALL ───────────────────────────────────────────────────────
export const getAllOrganizations = async (): Promise<IOrganization[]> => {
  return OrganizationModel.find({ isActive: true }).populate("ownerId", "userName email");
};

// ── GET SINGLE ────────────────────────────────────────────────────
export const getOrganizationById = async (
  organizationId: string
): Promise<IOrganization> => {
  const organization = await OrganizationModel.findById(organizationId).populate(
    "ownerId",
    "userName email"
  );
  if (!organization) throw new ApiError(404, "Organization not found");
  return organization;
};

// ── UPDATE ────────────────────────────────────────────────────────
export const updateOrganization = async (
  organizationId: string,
  updates: Partial<Pick<IOrganization, "name" | "contactEmail" | "phone">>
): Promise<IOrganization> => {
  const organization = await OrganizationModel.findByIdAndUpdate(
    organizationId,
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!organization) throw new ApiError(404, "Organization not found");
  return organization;
};

// ── DELETE (soft delete) ──────────────────────────────────────────
export const deleteOrganization = async (
  organizationId: string
): Promise<void> => {
  const organization = await OrganizationModel.findById(organizationId);
  if (!organization) throw new ApiError(404, "Organization not found");

  organization.isActive = false;
  await organization.save();
};