import asyncHandler from "express-async-handler";
import jsend from "jsend";

import QuizAttempt from "../models/QuizAttempt.model.js";
import Quiz from "../models/quiz.model.js";
import Question from "../models/Question.model.js";
import Enrollment from "../models/Enrollment.model.js";

// =====================================================
// Helper: جلب الكويز مع بيانات الكورس
// =====================================================
const getQuizWithCourse = async (quizId) => {
  return Quiz.findById(quizId).populate({
    path: "lesson",
    populate: { path: "course" },
  });
};

const canRevealAnswers = (attempt) => {
  const quiz = attempt.quiz;
  if (!quiz || typeof quiz !== "object") return false;

  if (quiz.showAnswersAfter === "immediately") return true;
  if (
    quiz.showAnswersAfter === "after-submit" &&
    attempt.status !== "in-progress"
  ) {
    return true;
  }
  return (
    quiz.showAnswersAfter === "after-due-date" &&
    quiz.endDate &&
    new Date() >= quiz.endDate
  );
};

const serializeStudentAttempt = (attempt) => {
  const result = attempt.toObject();

  if (!canRevealAnswers(attempt)) {
    for (const answer of result.answers) {
      delete answer.isCorrect;
      delete answer.pointsEarned;

      if (answer.questionId && typeof answer.questionId === "object") {
        delete answer.questionId.correctAnswer;
        delete answer.questionId.explanation;
        answer.questionId.choices = answer.questionId.choices?.map(
          ({ isCorrect, ...choice }) => choice,
        );
      }
    }
  }

  if (result.quiz && typeof result.quiz === "object") {
    delete result.quiz.showAnswersAfter;
    delete result.quiz.endDate;
  }

  return result;
};

// =====================================================
// Start Quiz Attempt
// POST /api/quizzes/:quizId/attempts/start
// =====================================================
export const startQuizAttempt = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const studentId = req.user._id;

  const quiz = await getQuizWithCourse(quizId);

  if (!quiz) {
    return res.status(404).json(jsend.error("Quiz not found"));
  }

  // التأكد إن الطالب مسجل في الكورس
  const isEnrolled = await Enrollment.findOne({
    student: studentId,
    course: quiz.lesson.course._id,
  });

  if (!isEnrolled) {
    return res
      .status(403)
      .json(jsend.error("You are not enrolled in this course"));
  }

  // منع بدء محاولة جديدة لو فيه محاولة شغالة
  const inProgress = await QuizAttempt.findOne({
    quiz: quizId,
    student: studentId,
    status: "in-progress",
  });

  if (inProgress) {
    return res.status(200).json(jsend.success(inProgress));
  }

  if (!quiz.isAvailable) {
    return res.status(400).json(jsend.error("This quiz is not available"));
  }

  // عدد المحاولات السابقة
  const previousAttempts = await QuizAttempt.countDocuments({
    quiz: quizId,
    student: studentId,
  });

  if (previousAttempts >= quiz.maxAttempts) {
    return res
      .status(400)
      .json(jsend.error("You have reached the maximum number of attempts"));
  }

  const attempt = await QuizAttempt.create({
    quiz: quizId,
    student: studentId,
    attemptNumber: previousAttempts + 1,
    answers: [],
    status: "in-progress",
    startedAt: new Date(),
  });

  res.status(201).json(jsend.success(attempt));
});

// =====================================================
// Submit Quiz Attempt
// POST /api/attempts/:attemptId/submit
// =====================================================
export const submitQuizAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const studentId = req.user._id;
  const { answers } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json(jsend.error("Answers must be an array"));
  }

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    student: studentId,
  });

  if (!attempt) {
    return res.status(404).json(jsend.error("Quiz attempt not found"));
  }

  if (attempt.status !== "in-progress") {
    return res
      .status(400)
      .json(jsend.error("This quiz attempt has already been submitted"));
  }

  const quiz = await Quiz.findById(attempt.quiz);

  if (!quiz) {
    return res.status(404).json(jsend.error("Quiz not found"));
  }

  const questions = await Question.find({ quiz: attempt.quiz }).sort({
    order: 1,
  });

  if (!questions.length) {
    return res.status(400).json(jsend.error("This quiz has no questions"));
  }

  // خريطة الإجابات للوصول السريع
  const answersMap = new Map(answers.map((a) => [a.questionId?.toString(), a]));

  let score = 0;
  let totalPoints = 0;
  const evaluatedAnswers = [];

  for (const question of questions) {
    totalPoints += question.points || 0;

    const studentAnswer = answersMap.get(question._id.toString());

    // الطالب م جاوبش
    if (!studentAnswer) {
      evaluatedAnswers.push({
        questionId: question._id,
        selectedChoiceId: null,
        answerText: null,
        isCorrect: false,
        pointsEarned: 0,
      });
      continue;
    }

    let isCorrect = false;

    // Multiple Choice / True-False
    if (question.type === "multiple-choice" || question.type === "true-false") {
      const selected = question.choices.find(
        (c) => c._id.toString() === studentAnswer.selectedChoiceId?.toString(),
      );
      if (selected && selected.isCorrect) isCorrect = true;
    }

    // Short Answer
    else if (question.type === "short-answer") {
      if (
        studentAnswer.answerText &&
        question.correctAnswer &&
        studentAnswer.answerText.trim().toLowerCase() ===
          question.correctAnswer.trim().toLowerCase()
      ) {
        isCorrect = true;
      }
    }

    // Essay → تصحيح يدوي لاحقًا
    else if (question.type === "essay") {
      isCorrect = false;
    }

    const pointsEarned = isCorrect ? question.points || 0 : 0;
    score += pointsEarned;

    evaluatedAnswers.push({
      questionId: question._id,
      selectedChoiceId: studentAnswer.selectedChoiceId || null,
      answerText: studentAnswer.answerText || null,
      isCorrect,
      pointsEarned,
    });
  }

  const percentage =
    totalPoints > 0 ? Number(((score / totalPoints) * 100).toFixed(2)) : 0;

  const isPassed = percentage >= (quiz.passingScore ?? 50);

  const submittedAt = new Date();
  const timeSpent = Math.floor(
    (submittedAt.getTime() - attempt.startedAt.getTime()) / 1000,
  );

  // لو فيه أسئلة مقالية → الحالة "submitted" لحد ما تتصحح
  const hasEssay = questions.some((q) => q.type === "essay");

  attempt.answers = evaluatedAnswers;
  attempt.score = score;
  attempt.totalPoints = totalPoints;
  attempt.percentage = percentage;
  attempt.isPassed = isPassed;
  attempt.submittedAt = submittedAt;
  attempt.timeSpent = timeSpent;
  attempt.status = hasEssay ? "submitted" : "graded";

  await attempt.save();

  res.status(200).json(jsend.success(attempt));
});

// =====================================================
// Get Attempt By ID
// GET /api/attempts/:attemptId
// =====================================================
export const getQuizAttemptById = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const studentId = req.user._id;

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    student: studentId,
  })
    .populate(
      "quiz",
      "title description maxMarks duration showAnswersAfter endDate",
    )
    .populate("student", "name email");

  if (!attempt) {
    return res.status(404).json(jsend.error("Quiz attempt not found"));
  }

  const questionFields = canRevealAnswers(attempt)
    ? "questionText type points choices.text choices.isCorrect correctAnswer explanation"
    : "questionText type points choices.text";
  await attempt.populate({
    path: "answers.questionId",
    select: questionFields,
  });

  res.status(200).json(jsend.success(serializeStudentAttempt(attempt)));
});

// =====================================================
// Get My Attempts For a Quiz
// GET /api/quizzes/:quizId/attempts/me
// =====================================================
export const getMyQuizAttempts = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const studentId = req.user._id;

  const attempts = await QuizAttempt.find({
    quiz: quizId,
    student: studentId,
  })
    .populate(
      "quiz",
      "title description maxMarks duration showAnswersAfter endDate",
    )
    .sort({ attemptNumber: -1 });

  res.status(200).json(jsend.success(attempts.map(serializeStudentAttempt)));
});

// =====================================================
// Get All My Attempts
// GET /api/attempts/me
// =====================================================
export const getMyAttempts = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const attempts = await QuizAttempt.find({ student: studentId })
    .populate(
      "quiz",
      "title description maxMarks duration showAnswersAfter endDate",
    )
    .sort({ createdAt: -1 });

  res.status(200).json(jsend.success(attempts.map(serializeStudentAttempt)));
});

// =====================================================
// Get Latest Attempt For a Quiz
// GET /api/quizzes/:quizId/attempts/latest
// =====================================================
export const getLatestQuizAttempt = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const studentId = req.user._id;

  const attempt = await QuizAttempt.findOne({
    quiz: quizId,
    student: studentId,
  })
    .populate(
      "quiz",
      "title description maxMarks duration showAnswersAfter endDate",
    )
    .sort({ attemptNumber: -1 });

  if (!attempt) {
    return res.status(404).json(jsend.error("No quiz attempt found"));
  }

  res.status(200).json(jsend.success(serializeStudentAttempt(attempt)));
});
