import express from "express";
import {
  createQuiz,
  getQuizzesByLesson,
  getQuizById,
  updateQuiz,
  deleteQuiz,
} from "../controllers/quiz.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import role from "../middlewares/roleMiddleware.js";

const quizRouter = express.Router();

// =====================================================
// Quiz Routes
// Base: /api/quizzes
// =====================================================

// Create quiz inside a lesson (instructor only)
quizRouter.post(
  "/lesson/:lessonId",
  authMiddleware,
  role("admin", "instructor"),
  createQuiz,
);

// Get all quizzes for a lesson (instructor or enrolled student)
quizRouter.get("/lesson/:lessonId", authMiddleware, getQuizzesByLesson);

// Get single quiz
quizRouter.get("/:quizId", authMiddleware, getQuizById);

// Update quiz (instructor only)
quizRouter.put(
  "/:quizId",
  authMiddleware,
  role("admin", "instructor"),
  updateQuiz,
);

// Delete quiz (instructor only)
quizRouter.delete(
  "/:quizId",
  authMiddleware,
  role("admin", "instructor"),
  deleteQuiz,
);

export default quizRouter;
