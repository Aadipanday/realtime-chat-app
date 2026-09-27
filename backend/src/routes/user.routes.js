import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  getAllUsers,
  updateUserAvatar,
  changeCurrentPassword,
  getUserProfile,
  updatePrivacySettings,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.route("/register").post(upload.single("avatar"), registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// Protected routes (require JWT verification)
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/privacy").patch(verifyJWT, updatePrivacySettings);
router.route("/profile").patch(verifyJWT, updateUserProfile);
router.route("/profile/:userId").get(verifyJWT, getUserProfile);
router.route("/").get(verifyJWT, getAllUsers);
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/:userId").get(verifyJWT, getUserProfile);

export default router;
