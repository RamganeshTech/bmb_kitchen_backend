import RoleModel, { PERMISSION_KEYS, PermissionKey } from '../../../models/role_model/role.model.js';
import UserModel from '../../../models/user_models/user.model.js';
import { ApiError } from '../../../utils/apiError.js';

interface CreateRoleInput {
  name: string;
  description?: string;
  isFullAccess?: boolean;
  permissions?: PermissionKey[];
}

interface UpdateRoleInput {
  name?: string;
  description?: string;
  isFullAccess?: boolean;
  permissions?: PermissionKey[];
}

function validatePermissions(permissions?: PermissionKey[]) {
  if (!permissions) return;
  const invalid = permissions.filter((p) => !PERMISSION_KEYS.includes(p));
  if (invalid.length) {
    throw new ApiError(400, `Invalid permission key(s): ${invalid.join(', ')}`);
  }
}

export const createRole = async (
  organizationId: string,
  userId: string,
  payload: CreateRoleInput
) => {
  const { name, description, isFullAccess, permissions } = payload;

  if (!name?.trim()) {
    throw new ApiError(400, 'Role name is required');
  }

  const existing = await RoleModel.findOne({
    organizationId,
    name: { $regex: `^${name.trim()}$`, $options: 'i' },
  });
  if (existing) {
    throw new ApiError(409, `Role "${name}" already exists`);
  }

  validatePermissions(permissions);

  const role = await RoleModel.create({
    organizationId,
    name: name.trim(),
    description,
    isFullAccess: !!isFullAccess,
    permissions: isFullAccess ? [] : permissions || [],
    createdBy: userId,
  });

  return role;
};

export const getRoleById = async (organizationId: string, id: string) => {
  const role = await RoleModel.findOne({ _id: id, organizationId });
  if (!role) throw new ApiError(404, 'Role not found');
  return role;
};

export const listActiveRoles = async (organizationId: string) => {
  return RoleModel.find({ organizationId, isActive: true }).sort({ createdAt: -1 });
};

export const listInactiveRoles = async (organizationId: string) => {
  return RoleModel.find({ organizationId, isActive: false }).sort({ createdAt: -1 });
};

export const listRolesDropdown = async (organizationId: string) => {
  return RoleModel.find({ organizationId, isActive: true }).select('name isFullAccess');
};

export const updateRole = async (
  organizationId: string,
  userId: string,
  id: string,
  payload: UpdateRoleInput
) => {
  const { name, description, isFullAccess, permissions } = payload;

  if (name !== undefined) {
    if (!name.trim()) throw new ApiError(400, 'Role name cannot be empty');

    const duplicate = await RoleModel.findOne({
      _id: { $ne: id },
      organizationId,
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });
    if (duplicate) throw new ApiError(409, `Role "${name}" already exists`);
  }

  validatePermissions(permissions);

  const updatePayload: Record<string, any> = { updatedBy: userId };
  if (name !== undefined) updatePayload.name = name.trim();
  if (description !== undefined) updatePayload.description = description;
  if (isFullAccess !== undefined) {
    updatePayload.isFullAccess = isFullAccess;
    updatePayload.permissions = isFullAccess ? [] : permissions || [];
  } else if (permissions !== undefined) {
    updatePayload.permissions = permissions;
  }

  const role = await RoleModel.findOneAndUpdate({ _id: id, organizationId }, updatePayload, {
    new: true,
    runValidators: true,
  });

  if (!role) throw new ApiError(404, 'Role not found');
  return role;
};

export const softDeleteRole = async (organizationId: string, userId: string, id: string) => {
  const role = await RoleModel.findOneAndUpdate(
    { _id: id, organizationId },
    { isActive: false, updatedBy: userId },
    { new: true }
  );
  if (!role) throw new ApiError(404, 'Role not found');
  return role;
};

export const restoreRole = async (organizationId: string, userId: string, id: string) => {
  const role = await RoleModel.findOneAndUpdate(
    { _id: id, organizationId },
    { isActive: true, updatedBy: userId },
    { new: true }
  );
  if (!role) throw new ApiError(404, 'Role not found');
  return role;
};


export const hardDeleteRole = async (organizationId: string, id: string) => {
  // Guard: block deletion if any staff member currently has this role — matches
  // the HTML's delRole check (S.staff.some(s=>s.role===id))
  const staffCount = await UserModel.countDocuments({ organizationId, specificRole: id });
  if (staffCount > 0) {
    throw new ApiError(400, 'Reassign staff before deleting this role');
  }

  const role = await RoleModel.findOneAndDelete({ _id: id, organizationId });
  if (!role) throw new ApiError(404, 'Role not found');
  return role;
};