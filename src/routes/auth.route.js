import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  register,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
  updateProfile,
} from "../controllers/auth.controller.js";
import {
  validateChangePassword,
  validateForgotPassword,
  validateLogin,
  validateRegister,
  validateResetPassword,
  validateUpdateProfile,
} from "../validations/auth.validation.js";
import { uploadImage } from "../middlewares/uploudMiddleware.js";
const AuthRouter = express.Router();

AuthRouter.post(
  "/register",
  validateRegister,
  uploadImage.single("profilePicture"),
  register,
);
AuthRouter.post("/login", validateLogin, login);
AuthRouter.put(
  "/change-password",
  authMiddleware,
  validateChangePassword,
  changePassword,
);
AuthRouter.post("/forgot-password", validateForgotPassword, forgotPassword);
AuthRouter.post("/reset-password", validateResetPassword, resetPassword);
AuthRouter.post("/logout", authMiddleware, logout);
AuthRouter.get("/me", authMiddleware, getMe);
AuthRouter.put(
  "/update-profile",
  authMiddleware,
  uploadImage.single("profilePicture"),
  validateUpdateProfile,
  updateProfile,
);

export default AuthRouter;
