import asyncHandler from "express-async-handler";
import jsend from "jsend";

import Question from "../models/Question.model.js";
import Quiz from "../models/quiz.model.js";
import Enrollment from "../models/Enrollment.model.js";

// =====================================================
// Helper: التحقق من صلاحية المدرس على الكويز
// =====================================================
const getQuizWithInstructor = async (quizId) => {
  return Quiz.findById(quizId).populate({
    path: "lesson",
    populate: { path: "course", populate: { path: "instructor" } },
  });
};

// =====================================================
// Create Question
// POST /api/quizzes/:quizId/questions
// =====================================================
export const createQuestion = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user._id;

  const quiz = await getQuizWithInstructor(quizId);

  if (!quiz) {
    return res.status(404).json(jsend.error("Quiz not found"));
  }

  if (quiz.lesson.course.instructor._id.toString() !== userId.toString()) {
    return res
      .status(403)
      .json(jsend.error("You are not the instructor of this course"));
  }

  const {
    questionText,
    type,
    points,
    order,
    choices,
    correctAnswer,
    difficulty,
    explanation,
  } = req.body;
  const questionOrder =
    order === undefined
      ? (await Question.countDocuments({ quiz: quizId })) + 1
      : order;

  const question = await Question.create({
    quiz: quizId,
    questionText,
    type,
    points,
    order: questionOrder,
    choices,
    correctAnswer,
    difficulty,
    explanation,
  });

  res.status(201).json(jsend.success(question));
});

// =====================================================
// Get Questions By Quiz
// GET /api/quizzes/:quizId/questions
// =====================================================
export const getQuestionsByQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user._id;

  const quiz = await Quiz.findById(quizId).populate({
    path: "lesson",
    populate: { path: "course" },
  });

  if (!quiz) {
    return res.status(404).json(jsend.error("Quiz not found"));
  }

  const isInstructor =
    quiz.lesson.course.instructor.toString() === userId.toString();

  const isEnrolled = await Enrollment.findOne({
    student: userId,
    course: quiz.lesson.course._id,
  });

  if (!isInstructor && !isEnrolled) {
    return res
      .status(403)
      .json(jsend.error("You are not enrolled in this course"));
  }

  let questions = await Question.find({ quiz: quizId }).sort({ order: 1 });

  // إخفاء الإجابات الصحيحة عن الطالب
  if (!isInstructor) {
    questions = questions.map((q) => {
      const qObj = q.toObject();

      delete qObj.correctAnswer;
      delete qObj.explanation;

      if (Array.isArray(qObj.choices)) {
        qObj.choices = qObj.choices.map((c) => ({
          _id: c._id,
          text: c.text,
        }));
      }

      return qObj;
    });
  }

  res.status(200).json(jsend.success(questions));
});

// =====================================================
// Update Question
// PUT /api/questions/:questionId
// =====================================================
export const updateQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const userId = req.user._id;

  const question = await Question.findById(questionId).populate({
    path: "quiz",
    populate: {
      path: "lesson",
      populate: { path: "course" },
    },
  });

  if (!question) {
    return res.status(404).json(jsend.error("Question not found"));
  }

  if (question.quiz.lesson.course.instructor.toString() !== userId.toString()) {
    return res
      .status(403)
      .json(jsend.error("You are not the instructor of this course"));
  }

  // منع تغيير الكويز التابع له السؤال
  delete req.body.quiz;

  const updated = await Question.findByIdAndUpdate(questionId, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(jsend.success(updated));
});

// =====================================================
// Delete Question
// DELETE /api/questions/:questionId
// =====================================================
export const deleteQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const userId = req.user._id;

  const question = await Question.findById(questionId).populate({
    path: "quiz",
    populate: {
      path: "lesson",
      populate: { path: "course" },
    },
  });

  if (!question) {
    return res.status(404).json(jsend.error("Question not found"));
  }

  if (question.quiz.lesson.course.instructor.toString() !== userId.toString()) {
    return res
      .status(403)
      .json(jsend.error("You are not the instructor of this course"));
  }

  await question.deleteOne();

  res
    .status(200)
    .json(jsend.success({ message: "Question deleted successfully" }));
});
