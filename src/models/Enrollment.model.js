import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["enrolled", "cancelled"],
      default: "enrolled",
    },

    progress: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ course: 1, createdAt: -1 });
enrollmentSchema.index({ student: 1, createdAt: -1 });
export default mongoose.model("Enrollment", enrollmentSchema);
