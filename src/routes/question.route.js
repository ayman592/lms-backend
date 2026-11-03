import express from "express";
import {
  createQuestion,
  getQuestionsByQuiz,
  updateQuestion,
  deleteQuestion,
} from "../controllers/question.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import role from "../middlewares/roleMiddleware.js";

// ملاحظة: بنستخدم mergeParams: true عشان نوصل لـ :quizId
const questionRouter = express.Router({ mergeParams: true });

// =====================================================
// Question Routes
// Base: /api/quizzes/:quizId/questions  (nested)
//       /api/questions/:questionId       (standalone)
// =====================================================

// Create question inside a quiz (instructor only)
questionRouter.post(
  "/",
  authMiddleware,
  role("admin", "instructor"),
  createQuestion,
);

// Get questions of a quiz (instructor or enrolled student)
questionRouter.get("/", authMiddleware, getQuestionsByQuiz);

export default questionRouter;

// =====================================================
// Separate router for direct question operations
// Base: /api/questions
// =====================================================
export const directQuestionRouter = express.Router();

directQuestionRouter.put(
  "/:questionId",
  authMiddleware,
  role("admin", "instructor"),
  updateQuestion,
);

directQuestionRouter.delete(
  "/:questionId",
  authMiddleware,
  role("admin", "instructor"),
  deleteQuestion,
);
