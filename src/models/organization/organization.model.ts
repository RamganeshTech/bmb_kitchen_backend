import mongoose, { Document, Schema } from "mongoose";
export type ICountry = "IN" | "AE" | "SA" | "QA" | "KW" | "BH" | "OM"; // India + GCC, extend as needed


export interface IUpload {
  type: "image" | "pdf" | "video";
  key?: string;
  url?: string;
  originalName?: string;
  uploadedAt: Date;
}

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  contactEmail: string;
  phone?: string;
  ownerId: mongoose.Types.ObjectId;
  isActive: boolean;
  logo: IUpload
  countryCode: ICountry;
  createdAt: Date;
  updatedAt: Date;
}


export const uploadSchema = new Schema<IUpload>({
  type: { type: String, enum: ["image", "pdf", "video"] },
  key: { type: String, },
  url: { type: String, },
  originalName: String,
  uploadedAt: { type: Date, default: new Date() }
});

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    logo: {
      type: uploadSchema,
      default: null
    },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    countryCode: { type: String, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "UserModel" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// organizationSchema.index({name: 1})


const OrganizationModel = mongoose.model<IOrganization>(
  "OrganizationModel",
  organizationSchema
);

export default OrganizationModel;