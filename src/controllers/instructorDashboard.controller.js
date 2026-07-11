import asynchandler from "express-async-handler";
import jsend from "jsend";
import Course from "../models/Course.model.js";

export const getInstructorDashboard = asynchandler(async (req, res) => {
  const instructorId = req.user._id;
  const totalCourses = await Course.countDocuments({
    instructor: instructorId,
  });
  const totalPublishedCourses = await Course.countDocuments({
    instructor: instructorId,
    status: "published",
  });
  const totalDraftCourses = await Course.countDocuments({
    instructor: instructorId,
    status: "draft",
  });
  res.json(
    jsend.success({
      totalCourses,
      totalPublishedCourses,
      totalDraftCourses,
    }),
  );
});
// My draft Courses
export const getMyDraftCourses = asynchandler(async (req, res) => {
  const courses = await Course.find({
    instructor: req.user._id,
    status: "draft",
  });
  res.json(
    jsend.success({
      courses,
    }),
  );
});

// My published Courses
export const getMyPublishedCourses = asynchandler(async (req, res) => {
  const courses = await Course.find({
    instructor: req.user._id,
    status: "published",
  });
  res.json(
    jsend.success({
      courses,
    }),
  );
});
