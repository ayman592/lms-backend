import express from "express";
import {
  getInstructorDashboard,
  getMyDraftCourses,
  getMyPublishedCourses,
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
  "/my-draft-courses",
  authMiddleware,
  role("instructor"),
  getMyDraftCourses,
);
instructorDashboardRoutes.get(
  "/my-published-courses",
  authMiddleware,
  role("instructor"),
  getMyPublishedCourses,
);

export default instructorDashboardRoutes;
