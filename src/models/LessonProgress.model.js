import mongoose from "mongoose";

const lessonProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },

    // هل الطالب أكمل الدرس؟
    isCompleted: {
      type: Boolean,
      default: false,
    },

    // آخر موضع وصل إليه الطالب في الفيديو بالثواني
    lastPosition: {
      type: Number,
      default: 0,
      min: 0,
    },

    // مدة الفيديو بالثواني
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    // تاريخ إكمال الدرس
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// منع تكرار تقدم الطالب في نفس الدرس
lessonProgressSchema.index(
  {
    student: 1,
    lesson: 1,
  },
  {
    unique: true,
  },
);
lessonProgressSchema.index({ student: 1, course: 1 });
const LessonProgress = mongoose.model("LessonProgress", lessonProgressSchema);

export default LessonProgress;
