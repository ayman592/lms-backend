import asyncHandler from "express-async-handler";
import jsend from "jsend";

import Lesson from "../models/Lesson.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Quiz from "../models/quiz.model.js";
import Question from "../models/Question.model.js";
import QuizAttempt from "../models/QuizAttempt.model.js";

// =====================================================
// Create Quiz
// POST /api/lessons/:lessonId/quizzes
// =====================================================
export const createQuiz = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user._id;

  const {
    title,
    description,
    maxMarks,
    duration,
    passingScore,
    maxAttempts,
    shuffleQuestions,
    shuffleChoices,
    showAnswersAfter,
    startDate,
    endDate,
  } = req.body;

  const lesson = await Lesson.findById(lessonId).populate("course");

  if (!lesson) {
    return res.status(404).json(jsend.error("Lesson not found"));
  }

  if (lesson.course.instructor.toString() !== userId.toString()) {
    return res
      .status(403)
      .json(jsend.error("You are not the instructor of this course"));
  }

  const quiz = await Quiz.create({
    title,
    description,
    maxMarks,
    duration,
    passingScore,
    maxAttempts: maxAttempts || 3,
    shuffleQuestions,
    shuffleChoices,
    showAnswersAfter,
    startDate,
    endDate,
    status: "published",
    lesson: lessonId,
    instructor: userId,
  });

  res.status(201).json(jsend.success(quiz));
});

// =====================================================
// Get Quizzes By Lesson
// GET /api/lessons/:lessonId/quizzes
// =====================================================
export const getQuizzesByLesson = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user._id;

  const lesson = await Lesson.findById(lessonId).populate({
    path: "course",
    populate: { path: "instructor" },
  });

  if (!lesson) {
    return res.status(404).json(jsend.error("Lesson not found"));
  }

  const isInstructor =
    lesson.course.instructor._id.toString() === userId.toString();

  const isEnrolled = await Enrollment.findOne({
    course: lesson.course._id,
    student: userId,
  });

  if (!isInstructor && !isEnrolled) {
    return res
      .status(403)
      .json(jsend.error("You are not enrolled in this course"));
  }

  const quizzes = await Quiz.find({ lesson: lessonId }).sort({ createdAt: -1 });
  console.log(quizzes);

  res.status(200).json(jsend.success(quizzes));
});

// =====================================================
// Get Quiz By ID
// GET /api/quizzes/:quizId
// =====================================================
export const getQuizById = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user._id;

  const quiz = await Quiz.findById(quizId).populate({
    path: "lesson",
    populate: {
      path: "course",
      populate: { path: "instructor" },
    },
  });

  if (!quiz) {
    return res.status(404).json(jsend.error("Quiz not found"));
  }

  const isInstructor =
    quiz.lesson.course.instructor._id.toString() === userId.toString();

  const isEnrolled = await Enrollment.findOne({
    course: quiz.lesson.course._id,
    student: userId,
  });

  if (!isInstructor && !isEnrolled) {
    return res
      .status(403)
      .json(jsend.error("You are not enrolled in this course"));
  }

  res.status(200).json(jsend.success(quiz));
});

// =====================================================
// Update Quiz
// PUT /api/quizzes/:quizId
// =====================================================
export const updateQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user._id;

  const quiz = await Quiz.findById(quizId).populate({
    path: "lesson",
    populate: {
      path: "course",
      populate: { path: "instructor" },
    },
  });

  if (!quiz) {
    return res.status(404).json(jsend.error("Quiz not found"));
  }

  if (quiz.lesson.course.instructor._id.toString() !== userId.toString()) {
    return res
      .status(403)
      .json(jsend.error("You are not the instructor of this course"));
  }

  const allowedFields = [
    "title",
    "description",
    "maxMarks",
    "duration",
    "passingScore",
    "maxAttempts",
    "shuffleQuestions",
    "shuffleChoices",
    "showAnswersAfter",
    "startDate",
    "endDate",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) quiz[field] = req.body[field];
  });

  await quiz.save();

  res.status(200).json(jsend.success(quiz));
});

// =====================================================
// Delete Quiz
// DELETE /api/quizzes/:quizId
// =====================================================
export const deleteQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user._id;

  const quiz = await Quiz.findById(quizId).populate({
    path: "lesson",
    populate: {
      path: "course",
      populate: { path: "instructor" },
    },
  });

  if (!quiz) {
    return res.status(404).json(jsend.error("Quiz not found"));
  }

  if (quiz.lesson.course.instructor._id.toString() !== userId.toString()) {
    return res
      .status(403)
      .json(jsend.error("You are not the instructor of this course"));
  }

  // حذف كل الأسئلة والمحاولات المرتبطة
  await Promise.all([
    Question.deleteMany({ quiz: quizId }),
    QuizAttempt.deleteMany({ quiz: quizId }),
    quiz.deleteOne(),
  ]);

  res.status(200).json(jsend.success({ message: "Quiz deleted successfully" }));
});
