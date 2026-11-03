import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
      maxlength: 200,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    duration: {
      type: Number,
      default: 30, // minutes
      min: 1,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    maxMarks: {
      type: Number,
      default: 100,
      min: 1,
    },
    passingScore: {
      type: Number,
      default: 50, // percentage
      min: 0,
      max: 100,
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1,
    },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleChoices: { type: Boolean, default: false },
    showAnswersAfter: {
      type: String,
      enum: ["never", "immediately", "after-submit", "after-due-date"],
      default: "after-submit",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    // ===== Availability =====
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ===== Indexes =====
quizSchema.index({ lesson: 1, status: 1 });
quizSchema.index({ instructor: 1, createdAt: -1 });

// ===== Virtuals =====
quizSchema.virtual("isAvailable").get(function () {
  if (this.status !== "published") return false;
  const now = new Date();
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  return true;
});

quizSchema.virtual("isExpired").get(function () {
  return this.endDate && new Date() > this.endDate;
});

export default mongoose.model("Quiz", quizSchema);
