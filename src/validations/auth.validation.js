import { body } from "express-validator";

export const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .trim()
    .isEmail()
    .notEmpty()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .notEmpty()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const validateChangePassword = [
  body("currentPassword")
    .notEmpty()
    .trim()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

export const validateForgotPassword = [
  body("email")
    .trim()
    .isEmail()
    .notEmpty()
    .withMessage("Valid email is required"),
];

export const validateResetPassword = [
  body("email")
    .trim()
    .isEmail()
    .notEmpty()
    .withMessage("Valid email is required"),
  body("otp").trim().notEmpty().withMessage("OTP is required"),
  body("newPassword")
    .trim()
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

export const validateUpdateProfile = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .trim()
    .isEmail()
    .notEmpty()
    .withMessage("Valid email is required"),
];
