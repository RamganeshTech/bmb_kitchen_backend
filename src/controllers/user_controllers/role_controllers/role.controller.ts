import { Response, NextFunction } from 'express';
import * as roleService from './role.service.js';
import { RoleBasedRequest } from '../../../utils/utils.js';

export const createRole = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const { name, description, isFullAccess, permissions } = req.body;
    if (!name) {
      return res.status(400).json({ ok: false, message: 'name is required' });
    }

    const role = await roleService.createRole(organizationId, userId, {
      name,
      description,
      isFullAccess,
      permissions,
    });

    return res.status(201).json({ ok: true, data: role });
  } catch (error) {
    next(error);
  }
};

export const getRole = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const role = await roleService.getRoleById(organizationId, id);
    return res.status(200).json({ ok: true, data: role });
  } catch (error) {
    next(error);
  }
};

export const listActiveRoles = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const roles = await roleService.listActiveRoles(organizationId);
    return res.status(200).json({ ok: true, data: roles });
  } catch (error) {
    next(error);
  }
};

export const listInactiveRoles = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const roles = await roleService.listInactiveRoles(organizationId);
    return res.status(200).json({ ok: true, data: roles });
  } catch (error) {
    next(error);
  }
};

export const listRolesDropdown = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }

    const roles = await roleService.listRolesDropdown(organizationId);
    return res.status(200).json({ ok: true, data: roles });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const { name, description, isFullAccess, permissions } = req.body;
    const role = await roleService.updateRole(organizationId, userId, id, {
      name,
      description,
      isFullAccess,
      permissions,
    });

    return res.status(200).json({ ok: true, data: role });
  } catch (error) {
    next(error);
  }
};

export const softDeleteRole = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const role = await roleService.softDeleteRole(organizationId, userId, id);
    return res.status(200).json({ ok: true, data: role });
  } catch (error) {
    next(error);
  }
};

export const restoreRole = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    const userId = req.user!.userId;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const role = await roleService.restoreRole(organizationId, userId, id);
    return res.status(200).json({ ok: true, data: role });
  } catch (error) {
    next(error);
  }
};

export const hardDeleteRole = async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, id } = req.params;
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: 'organizationId is required' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    await roleService.hardDeleteRole(organizationId, id);
    return res.status(200).json({ ok: true, message: 'Role deleted' });
  } catch (error) {
    next(error);
  }
};