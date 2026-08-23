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
  const courses = await Course.find({
    instructor: instructorId,
  }).sort({ createdAt: -1 });
  res.json(
    jsend.success({
      courses,
    }),
  );
});
// // My draft Courses
// export const getMyDraftCourses = asynchandler(async (req, res) => {
//   const courses = await Course.find({
//     instructor: req.user._id,
//     status: "draft",
//   });
//   res.json(
//     jsend.success({
//       courses,
//     }),
//   );
// });

// // My published Courses
// export const getMyPublishedCourses = asynchandler(async (req, res) => {
//   const courses = await Course.find({
//     instructor: req.user._id,
//     status: "published",
//   });
//   console.log("Published courses:", courses);
//   res.json(
//     jsend.success({
//       courses,
//     }),
//   );
// });
