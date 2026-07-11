import express from "express";

import {
  enrollCourse,
  cancelEnrollment,
  getMyCourses,
  getCourseStudents,
} from "../controllers/Enrollment.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import role from "../middlewares/roleMiddleware.js";

const enrollmentRoutes = express.Router();

enrollmentRoutes.post("/enroll/:courseId", authMiddleware, enrollCourse);
enrollmentRoutes.delete(
  "/cancel/:enrollmentId",
  authMiddleware,
  cancelEnrollment,
);
enrollmentRoutes.get("/my-courses", authMiddleware, getMyCourses);
enrollmentRoutes.get(
  "/course-students/:courseId",
  role("admin", "instructor"),
  authMiddleware,
  getCourseStudents,
);

export default enrollmentRoutes;
