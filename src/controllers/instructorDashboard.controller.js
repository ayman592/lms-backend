import asynchandler from "express-async-handler";
import jsend from "jsend";
import Course from "../models/Course.model.js";
import Lesson from "../models/Lesson.model.js";

export const getInstructorDashboard = asynchandler(async (req, res) => {
  const instructorId = req.user._id;
  const totalCourses = await Course.countDocuments({
    instructor: instructorId,
  });
  const totalLessons = await Lesson.countDocuments({
    instructor: instructorId,
  });
  res.json(
    jsend.success({
      totalCourses,
      totalLessons,
    }),
  );
});

export const getMyCourses = asynchandler(async (req, res) => {
  const instructorId = req.user._id;
  const limit = Math.min(parseInt(req.query.limit) || 10, 20); // Default limit to 10 if not provided
  const page = Math.max(parseInt(req.query.page) || 1, 1); // Default page to 1 if not provided
  const skip = (page - 1) * limit;
  const courses = await Course.find({
    instructor: instructorId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
  res.json(
    jsend.success({
      courses,
    }),
  );
});
