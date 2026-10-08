import { Router } from "express";
import { register, login, getMe, logout, resetPassword, userAuthenticated, updateUserPermissions, updateUserData, getSingleUser, deleteUser, softDeleteUser, recoverUser, updateUserRole } from "../../controllers/user_controllers/auth.controller.js";
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
userRoutes.put("/v1/update", multiAuthRole("owner", "cto", "admin", "staff"), updateUserData);


userRoutes.get(
  "/v1/:userId",
  multiAuthRole("owner", "cto", "admin", "staff"),
  getSingleUser
);

userRoutes.put(
  "/v1/:organizationId/:userId/profile-image",
  upload.single("file"),
  multiAuthRole("owner", "cto", "admin"),
  updateProfileImage
);



userRoutes.put(
  "/v1/:userId/role",
  multiAuthRole("owner", "cto", "admin"),
  updateUserRole
);


// User listing scoped to the organization (e.g. for assigning Site Engineers)
userRoutes.get(
  "/",
  multiAuthRole("owner", "admin", "cto", "staff"),
  getAllUsers
);


userRoutes.delete(
  "/v1/:userId/delete",
  multiAuthRole("owner", "admin", "cto", "staff"),
  deleteUser
);



userRoutes.patch(
  "/v1/:userId/deactivate",
  multiAuthRole("owner", "admin", "cto", "staff"),
  softDeleteUser
);


userRoutes.patch(
  "/v1/:userId/recover",
  multiAuthRole("owner", "admin", "cto", "staff"),
  recoverUser
);


export default userRoutes;