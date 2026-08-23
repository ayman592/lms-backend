import express from "express";

import {
  enrollCourse,
  getMyCourses,
  getCourseStudents,
  checkEnrollment,
} from "../controllers/Enrollment.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import role from "../middlewares/roleMiddleware.js";

const enrollmentRoutes = express.Router();

enrollmentRoutes.post("/enroll/:courseId", authMiddleware, enrollCourse);

enrollmentRoutes.get("/my-courses", authMiddleware, getMyCourses);
enrollmentRoutes.get(
  "/course-students/:courseId",
  role("admin", "instructor"),
  authMiddleware,
  getCourseStudents,
);
enrollmentRoutes.get("/check/:courseId", authMiddleware, checkEnrollment);

export default enrollmentRoutes;
