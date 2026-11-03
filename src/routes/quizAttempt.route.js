import express from "express";
import {
  startQuizAttempt,
  submitQuizAttempt,
  getQuizAttemptById,
  getMyQuizAttempts,
  getMyAttempts,
  getLatestQuizAttempt,
} from "../controllers/QuizAttempt.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const AttemptRouter = express.Router();

// =====================================================
// Quiz Attempt Routes
// Base: /api/attempts
// =====================================================

// ⚠️ مهم جداً: الترتيب هنا حساس
// الـ routes المحددة (static) لازم تيجي قبل الـ dynamic (/:id)

// ---------- Specific routes first ----------

// Get all my attempts (current student)
AttemptRouter.get("/me", authMiddleware, getMyAttempts);

// Start a new attempt for a quiz
AttemptRouter.post("/quiz/:quizId/start", authMiddleware, startQuizAttempt);

// Get all my attempts for a specific quiz
AttemptRouter.get("/quiz/:quizId/me", authMiddleware, getMyQuizAttempts);

// Get my latest attempt for a specific quiz
AttemptRouter.get("/quiz/:quizId/latest", authMiddleware, getLatestQuizAttempt);

// Submit a specific attempt
AttemptRouter.post("/:attemptId/submit", authMiddleware, submitQuizAttempt);

// ---------- Dynamic routes last ----------

// Get a specific attempt by ID
AttemptRouter.get("/:attemptId", authMiddleware, getQuizAttemptById);

export default AttemptRouter;
