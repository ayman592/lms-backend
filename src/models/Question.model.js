import mongoose from "mongoose";

const choiceSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true },
);

const questionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["multiple-choice", "true-false", "short-answer", "essay"],
      default: "multiple-choice",
      required: true,
    },
    points: {
      type: Number,
      default: 10,
      min: 0,
    },
    order: {
      type: Number,
      default: 1,
      min: 1,
    },
    choices: {
      type: [choiceSchema],
      default: [],
      validate: {
        validator: function (v) {
          if (this.type === "multiple-choice") return v.length >= 2;
          if (this.type === "true-false") return v.length === 2;
          return true;
        },
        message: "Invalid number of choices for this question type",
      },
    },
    correctAnswer: {
      type: String,
      trim: true,
      default: null,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ===== Indexes =====
questionSchema.index({ quiz: 1, order: 1 }, { unique: true });

// ===== Virtuals =====
questionSchema.virtual("isValid").get(function () {
  if (this.type === "multiple-choice") {
    return this.choices.length >= 2 && this.choices.some((c) => c.isCorrect);
  }
  if (this.type === "true-false") {
    return this.choices.length === 2 && this.choices.some((c) => c.isCorrect);
  }
  return !!this.correctAnswer;
});

export default mongoose.model("Question", questionSchema);
