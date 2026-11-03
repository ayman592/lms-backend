import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "published",
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    thumbnail: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },

    price: {
      type: Number,
      default: 0,
    },

    thumbnail: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },
    lessonCount: {
      type: Number,
      default: 0,
    },
    countOfStudents: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

courseSchema.index({
  category: 1,
  createdAt: -1,
});
courseSchema.index({
  instructor: 1,
  createdAt: -1,
});
courseSchema.index({
  price: 1,
  createdAt: -1,
});
courseSchema.index({
  level: 1,
  createdAt: -1,
});

courseSchema.index(
  {
    title: "text",
    description: "text",
  },
  { weight: { title: 5, description: 10 } },
);

export default mongoose.model("Course", courseSchema);
