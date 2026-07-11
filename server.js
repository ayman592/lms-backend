import express from "express";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";

import AuthRouter from "./src/routes/auth.route.js";
import courseRoutes from "./src/routes/course.route.js";
import lessonRoutes from "./src/routes/lesson.route.js";
import enrollmentRoutes from "./src/routes/Enrollment.route.js";
import adminDashboardRoutes from "./src/routes/adminDashboard.route.js";
import instructorDashboardRoutes from "./src/routes/instructorDashboard.route.js";
dotenv.config();

connectDB();

const app = express();
app.use(express.json());

app.use("/api/auth", AuthRouter);
app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/instructor", instructorDashboardRoutes);

app.listen(process.env.port, () => {
  console.log(`Server is running on port ${process.env.port}`);
});
