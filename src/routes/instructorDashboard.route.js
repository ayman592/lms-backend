import express from "express";
import {
  getInstructorDashboard,
  getMyCourses,
} from "../controllers/instructorDashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import role from "../middlewares/roleMiddleware.js";

const instructorDashboardRoutes = express.Router();

instructorDashboardRoutes.get(
  "/dashboard",
  authMiddleware,
  role("instructor"),
  getInstructorDashboard,
);
instructorDashboardRoutes.get(
  "/my-courses",
  authMiddleware,
  role("instructor"),
  getMyCourses,
);

export default instructorDashboardRoutes;
