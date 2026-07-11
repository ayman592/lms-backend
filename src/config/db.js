import mongoose from "mongoose";

const connectDB = async () => {
  const url = process.env.MONGO_URI;
  try {
    await mongoose.connect(url);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
