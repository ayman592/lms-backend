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
      enum: ["draft", "published"],
      default: "draft",
    },

    price: {
      type: Number,
      default: 0,
    },

    thumbnail: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
  },
  { timestamps: true },
);

courseSchema.index({
  title: "text",
  description: "text",
});

export default mongoose.model("Course", courseSchema);
