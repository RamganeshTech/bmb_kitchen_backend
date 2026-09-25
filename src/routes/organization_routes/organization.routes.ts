import { Router } from "express";
import { registerOrganization , getAllOrganizations
, getOrganizationById
, updateOrganization
, deleteOrganization } from "../../controllers/organization_controllers/organization.controller.js";
import { multiAuthRole } from "../../middleware/auth.middleware.js";

const organizationRoutes = Router();

// Public — creates org + owner user together
organizationRoutes.post("/v1/register", registerOrganization);

// Protected — must be logged in
organizationRoutes.get("/v1/", multiAuthRole("owner", "admin", "cto", "staff"), getAllOrganizations);
organizationRoutes.get("/v1/:id", multiAuthRole("owner", "admin", "cto", "staff"), getOrganizationById);
organizationRoutes.patch("/v1/:id", multiAuthRole("owner", "admin", "cto", ), updateOrganization);
organizationRoutes.delete("/v1/:id", multiAuthRole("owner", "admin"), deleteOrganization);

export default organizationRoutes;