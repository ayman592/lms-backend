import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedChoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    answerText: { type: String, default: null, trim: true },
    isCorrect: { type: Boolean, default: false },
    pointsEarned: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ===== Answers =====
    answers: [answerSchema],

    // ===== Results =====
    score: { type: Number, default: 0, min: 0 },
    totalPoints: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    isPassed: { type: Boolean, default: false },

    // ===== Status =====
    status: {
      type: String,
      enum: ["in-progress", "submitted", "graded"],
      default: "in-progress",
      index: true,
    },

    // ===== Timing =====
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    timeSpent: { type: Number, default: 0 }, // seconds

    attemptNumber: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true },
);

// ===== Indexes =====
quizAttemptSchema.index(
  { quiz: 1, student: 1, attemptNumber: 1 },
  { unique: true },
);
quizAttemptSchema.index({ student: 1, status: 1 });

// ===== Methods =====
quizAttemptSchema.methods.calculateResults = function () {
  const total = this.answers.reduce((sum, a) => sum + a.pointsEarned, 0);
  this.score = total;
  this.percentage = this.totalPoints > 0 ? (total / this.totalPoints) * 100 : 0;
  return this;
};

export default mongoose.model("QuizAttempt", quizAttemptSchema);
