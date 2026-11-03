import express from "express";

import {
  getCourseProgress,
  getLessonProgress,
  saveLessonProgress,
  completeLesson,
} from "../controllers/lessonProgress.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const lessonProgressRouter = express.Router();

// جميع المسارات تحتاج تسجيل الدخول
lessonProgressRouter.use(authMiddleware);

// تقدم الكورس
lessonProgressRouter.get("/courses/:courseId", getCourseProgress);

// تقدم الدرس
lessonProgressRouter.get("/lessons/:lessonId", getLessonProgress);

// حفظ موضع الفيديو
lessonProgressRouter.patch("/lessons/:lessonId", saveLessonProgress);

// إكمال الدرس
lessonProgressRouter.post("/lessons/:lessonId/complete", completeLesson);

export default lessonProgressRouter;
