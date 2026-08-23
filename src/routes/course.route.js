import express from "express";
import {
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
  getCourseDetails,
} from "../controllers/course.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import role from "../middlewares/roleMiddleware.js";
import { uploadImage } from "../middlewares/uploudMiddleware.js";

const courseRoutes = express.Router();

courseRoutes.get("/", getCourses);
courseRoutes.get("/:id", getCourseDetails);
courseRoutes.post(
  "/",
  authMiddleware,
  role("admin", "instructor"),
  uploadImage.single("thumbnail"),
  createCourse,
);
courseRoutes.put(
  "/:id",
  authMiddleware,
  role("admin", "instructor"),
  uploadImage.single("thumbnail"),
  updateCourse,
);

courseRoutes.delete(
  "/:id",
  authMiddleware,
  role("admin", "instructor"),
  deleteCourse,
);

export default courseRoutes;
