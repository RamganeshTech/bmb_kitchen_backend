import { Router } from "express";
import { registerOrganization , getAllOrganizations
, getOrganizationById
, updateOrganization
, deleteOrganization } from "../../controllers/organization_controllers/organization.controller.js";
import { multiAuthRole } from "../../middleware/auth.middleware.js";

const organizationRoutes = Router();

// Public — creates org + owner user together
organizationRoutes.post("/register", registerOrganization);

// Protected — must be logged in
organizationRoutes.get("/", multiAuthRole("owner", "admin", "cto", "staff"), getAllOrganizations);
organizationRoutes.get("/:id", multiAuthRole("owner", "admin", "cto", "staff"), getOrganizationById);
organizationRoutes.patch("/:id", multiAuthRole("owner", "admin", "cto", ), updateOrganization);
organizationRoutes.delete("/:id", multiAuthRole("owner", "admin"), deleteOrganization);

export default organizationRoutes;