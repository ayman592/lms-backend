import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["student", "instructor", "admin"],
  },
  otp: {
    type: String,
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },

  otpExpireAt: {
    type: Date,
  },
  profilePicture: {
    url: {
      type: String,
    },
    publicId: {
      type: String,
    },
  },
});

export default mongoose.model("User", userSchema);
