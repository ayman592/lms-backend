import express from "express";
import connectDB from "./src/config/db.js";
import { connectRedis } from "./src/config/redis.js";
import jsend from "jsend";
import dotenv from "dotenv";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";

import AuthRouter from "./src/routes/auth.route.js";
import courseRoutes from "./src/routes/course.route.js";
import lessonRoutes from "./src/routes/lesson.route.js";
import enrollmentRoutes from "./src/routes/Enrollment.route.js";
import adminDashboardRoutes from "./src/routes/adminDashboard.route.js";
import instructorDashboardRoutes from "./src/routes/instructorDashboard.route.js";
import quizRouter from "./src/routes/quiz.route.js";
import questionRouter from "./src/routes/question.route.js";
import AttemptRouter from "./src/routes/quizAttempt.route.js";
import lessonProgressRouter from "./src/routes/lessonProgress.route.js";
import { directQuestionRouter } from "./src/routes/question.route.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://lms-frontend-r9ivnhdyc-ayman592s-projects.vercel.app",
  "https://lms-frontend-ruby-chi.vercel.app",
  "http://localhost:5173",
];
console.log("Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // المفتاح: تمرير false، وليس new Error
      return callback(null, false);
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

// === الـ limiter العام — يستثني auth + preflight ===
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 500 : 10000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS" || req.path.startsWith("/auth/"),
  handler: (req, res) =>
    res
      .status(429)
      .json(jsend.error("Too many requests, please try again later.")),
});

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 20,
//   standardHeaders: "draft-8",
//   legacyHeaders: false,
// });

// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 5,
//   standardHeaders: "draft-8",
//   legacyHeaders: false,
// });

app.use("/api", generalLimiter);

app.use("/api/auth", AuthRouter);

// app.use("/api/auth/login", loginLimiter);

app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/instructor", instructorDashboardRoutes);
app.use("/api/quizzes", quizRouter);
app.use("/api/quizzes/:quizId/questions", questionRouter);
app.use("/api/questions", directQuestionRouter);
app.use("/api/Attempts", AttemptRouter);
app.use("/api/lesson-progress", lessonProgressRouter);

app.get("/", (req, res) => {
  res.status(200).json(
    jsend.success({
      message: "LMS Backend is running",
    }),
  );
});

const startServer = async () => {
  await connectDB();
  await connectRedis();

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
