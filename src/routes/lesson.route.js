import express from "express";
import {
  createLesson,
  getLessons,
  updateLesson,
  deleteLesson,
  getLessonById,
  uploadProgress,
} from "../controllers/lesson.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import role from "../middlewares/roleMiddleware.js";
import { uploadVideo } from "../middlewares/uploudMiddleware.js";

const lessonRoutes = express.Router();

lessonRoutes.get(
  "/upload-progress/:uploadId",
  authMiddleware,
  role("admin", "instructor"),
  uploadProgress,
);

lessonRoutes.get("/course/:courseId", getLessons);
lessonRoutes.get("/:lessonId", getLessonById);
lessonRoutes.post(
  "/",
  authMiddleware,
  role("admin", "instructor"),
  uploadVideo.single("video"),
  createLesson,
);

lessonRoutes.put(
  "/:lessonId",
  authMiddleware,
  role("admin", "instructor"),
  uploadVideo.single("video"),
  updateLesson,
);
lessonRoutes.delete(
  "/:lessonId",
  authMiddleware,
  role("admin", "instructor"),
  deleteLesson,
);

export default lessonRoutes;
