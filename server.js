import express from "express";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
import cors from "cors";

import AuthRouter from "./src/routes/auth.route.js";
import courseRoutes from "./src/routes/course.route.js";
import lessonRoutes from "./src/routes/lesson.route.js";
import enrollmentRoutes from "./src/routes/Enrollment.route.js";
import adminDashboardRoutes from "./src/routes/adminDashboard.route.js";
import instructorDashboardRoutes from "./src/routes/instructorDashboard.route.js";
import cookieParser from "cookie-parser";
dotenv.config();

connectDB();

const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRUONT_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/auth", AuthRouter);
app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/instructor", instructorDashboardRoutes);
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "LMS Backend is running",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
