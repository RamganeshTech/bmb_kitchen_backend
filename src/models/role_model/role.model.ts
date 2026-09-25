import { Schema, model, Document, Types } from 'mongoose';

export const PERMISSION_KEYS = [
  'pos',
  'kot',
  'tables',
  'captain',
  'menu',
  'discount',
  'cancel',
  'reports',
  'closing',
  'inventory',
  'staff',
  'settings',
  'outlets',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export interface IRole extends Document {
  organizationId: Types.ObjectId;
  roleNo: string;
  name: string;
  description: string;
  isFullAccess: boolean; // maps to the HTML's perms.includes("all")
  permissions: PermissionKey[]; // ignored/empty when isFullAccess is true
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId | null;
}

const RoleSchema = new Schema<IRole>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'OrganizationModel', required: true },
    roleNo: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    isFullAccess: { type: Boolean, default: false },
    permissions: { type: [String], enum: PERMISSION_KEYS, default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'UserModel', default: null },
  },
  { timestamps: true }
);

// Role name should be unique per organization
RoleSchema.index({ organizationId: 1, name: 1 }, { unique: true });

RoleSchema.pre('save', async function (this: IRole) {
  if (!this.isNew) return;

  const prefix = 'ROL-';
  const lastRole = await RoleModel.findOne({
    organizationId: this.organizationId,
    roleNo: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select('roleNo')
    .lean();

  let nextNumber = 1;
  if (lastRole?.roleNo) {
    const lastNumberStr = lastRole.roleNo.split('-').pop();
    const lastNumber = parseInt(lastNumberStr || '0', 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }
  this.roleNo = `${prefix}${String(nextNumber).padStart(3, '0')}`;
});

const RoleModel = model<IRole>('RoleModel', RoleSchema);

export default RoleModel;