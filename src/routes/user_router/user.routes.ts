import { Router } from "express";
import { register, login, getMe, logout, resetPassword, userAuthenticated, updateUserPermissions } from "../../controllers/user_controllers/auth.controller.js";
import { multiAuthRole } from "../../middleware/auth.middleware.js";
import { forgotPassword, getAllUsers , updateProfileImage} from "../../controllers/user_controllers/auth.controller.js";
import { upload } from "../../utils/s3Upload.js";

const userRoutes = Router();

userRoutes.post("/v1/register", register);
userRoutes.post("/v1/login", login);
userRoutes.post("/v1/forgot-password", forgotPassword);
userRoutes.post("/v1/reset-password/:userId/:token", resetPassword);

/* ----------------- Protected Routes ------------------- */
// Authenticated user session
userRoutes.get("/v1/isauthenticated", multiAuthRole(), userAuthenticated);
userRoutes.get("/v1/me", multiAuthRole(), getMe);
userRoutes.post("/v1/logout", multiAuthRole(), logout);
userRoutes.post("/v1/update-permissions", multiAuthRole("owner", "cto", "admin"), updateUserPermissions);



userRoutes.put(
  "/v1/:organizationId/:userId/profile-image",
  upload.single("file"),
  multiAuthRole("owner", "cto", "admin"),
  updateProfileImage
);

// User listing scoped to the organization (e.g. for assigning Site Engineers)
userRoutes.get(
  "/",
  multiAuthRole("owner", "admin", "cto", "staff"),
  getAllUsers
);

export default userRoutes;