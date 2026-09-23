import { type Request, type Response, type NextFunction } from "express";
import * as organizationService from "./organization.services.js";
import type { RoleBasedRequest } from "../../utils/utils.js";

export const registerOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userName, email, password, organizationName, phone } = req.body;

    if (!userName || !email || !password || !organizationName) {
      res.status(400).json({ ok: false, message: "userName, email, password, organizationName are required" });
      return;
    }

    const { user } = await organizationService.createOrganization(
      userName, email, password, organizationName, phone
    );

    res.status(201).json({ ok: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getAllOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizations = await organizationService.getAllOrganizations();
    res.status(200).json({ ok: true, data: organizations });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationById = async (
  req: RoleBasedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // const { id } : {id:string} = req.params;
    const { id } = req.params as { id: string };
    const organization = await organizationService.getOrganizationById(id);
    res.status(200).json({ ok: true, data: organization });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params as {id:string};
    const { name, contactEmail, phone } = req.body;

    const updated = await organizationService.updateOrganization(id, {
      name, contactEmail, phone
    });

    res.status(200).json({ ok: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params as {id:string};
    await organizationService.deleteOrganization(id);
    res.status(200).json({ ok: true, message: "Organization deleted successfully" });
  } catch (error) {
    next(error);
  }
};