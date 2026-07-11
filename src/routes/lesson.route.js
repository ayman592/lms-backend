import express from "express";
import {
  createLesson,
  getLessons,
  updateLesson,
  deleteLesson,
  getLessonById,
} from "../controllers/lesson.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import role from "../middlewares/roleMiddleware.js";
import { upload } from "../middlewares/uploudMiddleware.js";

const lessonRoutes = express.Router();

lessonRoutes.get("/course/:courseId", getLessons);
lessonRoutes.get("/:lessonId", getLessonById);
lessonRoutes.post(
  "/",
  authMiddleware,
  role("admin", "instructor"),
  upload.single("video"),
  createLesson,
);
lessonRoutes.put(
  "/:lessonId",
  authMiddleware,
  role("admin", "instructor"),
  upload.single("video"),
  updateLesson,
);
lessonRoutes.delete(
  "/:lessonId",
  authMiddleware,
  role("admin", "instructor"),
  deleteLesson,
);

export default lessonRoutes;
