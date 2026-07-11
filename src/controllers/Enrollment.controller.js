import asynchandler from "express-async-handler";
import Enrollment from "../models/Enrollment.model.js";
import jsend from "jsend";
import Course from "../models/Course.model.js";
// Enroll Course
export const enrollCourse = asynchandler(async (req, res) => {
  const student = req.user._id;
  const { courseId } = req.params;

  const courseExists = await Course.findById(courseId);
  if (!courseExists) {
    return res.status(404).json(jsend.error("Course not found."));
  }

  const existingEnrollment = await Enrollment.findOne({
    course: courseId,
    student,
  });

  if (existingEnrollment) {
    return res
      .status(400)
      .json(jsend.error("You are already enrolled in this course."));
  }

  const enrollment = await Enrollment.create({
    course: courseId,
    student,
  });

  res.status(201).json(jsend.success(enrollment));
});
// Cancel Enrollment
export const cancelEnrollment = asynchandler(async (req, res) => {
  const { enrollmentId } = req.params;

  const enrollment = await Enrollment.findByIdAndDelete(enrollmentId);

  if (!enrollment) {
    return res.status(404).json(jsend.error("Enrollment not found."));
  }

  res.status(200).json(jsend.success("Enrollment canceled."));
});
// Get My Courses
export const getMyCourses = asynchandler(async (req, res) => {
  const studentId = req.user._id;

  const enrollments = await Enrollment.find({ student: studentId }).populate({
    path: "course",
    select: "title thumbnail price instructor",
  });

  res.json(jsend.success(enrollments));
});
// Get Course Students
export const getCourseStudents = asynchandler(async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json(jsend.error("Course not found."));
  }
  if (course.instructor.toString() !== req.user._id.toString()) {
    return res.status(403).json(jsend.error("Not allowed."));
  }
  const students = await Enrollment.find({ course: courseId }).populate(
    "student",
    "name email",
  );
  res.json(jsend.success(students));
});
