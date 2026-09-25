import mongoose, { Schema, Document, Types, model } from "mongoose";

// 1. Reusable Upload Interface
export interface IUpload {
  type: "image";
  key?: string;
  url?: string;
  originalName?: string;
  uploadedAt: Date;
}


export type IRole = "admin" | "owner" | "staff" | "cto";

export interface IActionPermission {
  create: boolean;
  get: boolean;
  update: boolean;
  delete: boolean;
}

export interface IUser extends Document {
  organizationId: Types.ObjectId;
  specificRole?: Types.ObjectId;
  email?: string;
  userName: string;
  password: string;
  role: IRole
  permissions: Record<string, IActionPermission>; // Allows dynamic modules in the future
  phoneNo?: string;
  profileImage: IUpload | null
  isActive: boolean
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const uploadSchema = new Schema<IUpload>({
  type: { type: String, enum: ["image"] },
  key: { type: String, },
  url: { type: String, },
  originalName: String,
  uploadedAt: { type: Date, default: new Date() }
});

const actionPermissionSchema = new Schema<IActionPermission>(
  {
    create: { type: Boolean, default: false },
    get: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new Schema<IUser>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "OrganizationModel",
      required: true,
    },


    specificRole: {
      type: Schema.Types.ObjectId,
      ref: "RoleModel",
      default: null
    },


    email: { type: String, default: "" },
    userName: { type: String, required: true },
    password: { type: String, required: true },

    permissions: {
      type: Map,
      of: actionPermissionSchema,
      default: {},
    },

    role: {
      type: String,
      // required: true, 
      // enum: ["correspondent", "teacher", "principal", "viceprincipal", "administrator", "parent", "accountant", null]
    },
    phoneNo: { type: String, default: "" },
    profileImage: {
      type: uploadSchema, default: null
    },
    isActive: { type: Boolean, default: true },
    // inside userSchema fields
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);



userSchema.index({ organizationId: 1, email: 1 })

const UserModel = model("UserModel", userSchema);

export default UserModel;
