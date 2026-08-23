import express from "express";
import {
  adminDashboard,
  suspendUser,
  activateUser,
  deleteUser,
  getAllUsers,
  createInstructor,
} from "../controllers/adminDashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import role from "../middlewares/roleMiddleware.js";

const adminDashboardRoutes = express.Router();

adminDashboardRoutes.get(
  "/dashboard",
  authMiddleware,
  role("admin"),
  adminDashboard,
);
adminDashboardRoutes.post(
  "/create-instructor",
  authMiddleware,
  role("admin"),
  createInstructor,
);
adminDashboardRoutes.patch(
  "/suspend-user/:userId",
  authMiddleware,
  role("admin"),
  suspendUser,
);
adminDashboardRoutes.patch(
  "/activate-user/:userId",
  authMiddleware,
  role("admin"),
  activateUser,
);
adminDashboardRoutes.delete(
  "/delete-user/:userId",
  authMiddleware,
  role("admin"),
  deleteUser,
);
adminDashboardRoutes.get("/users", authMiddleware, role("admin"), getAllUsers);

export default adminDashboardRoutes;
