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

  // Increment the countOfStudents in the Course model
  courseExists.countOfStudents += 1;
  await courseExists.save();

  res.status(201).json(jsend.success(enrollment));
});
// Cancel Enrollment
export const cancelEnrollment = asynchandler(async (req, res) => {
  const { enrollmentId } = req.params;

  const enrollment = await Enrollment.findByIdAndDelete(enrollmentId);

  if (!enrollment) {
    return res.status(404).json(jsend.error("Enrollment not found."));
  }
  // Decrement the countOfStudents in the Course model
  const course = await Course.findById(enrollment.course);
  if (course) {
    course.countOfStudents -= 1;
    await course.save();
  }

  res.status(200).json(jsend.success("Enrollment canceled."));
});
// Get My Courses
export const getMyCourses = asynchandler(async (req, res) => {
  const studentId = req.user._id;
  const limit = Math.min(parseInt(req.query.limit) || 10, 20); // Default limit to 10 if not provided
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;

  const enrollments = await Enrollment.find({ student: studentId })
    .populate({
      path: "course",
      select: "title thumbnail price instructor lessonCount countOfStudents",
    })
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });

  res.json(jsend.success(enrollments));
});
// Get Course Students
export const getCourseStudents = asynchandler(async (req, res) => {
  const { courseId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 10, 20);
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json(jsend.error("Course not found."));
  }
  if (
    course.instructor.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json(jsend.error("Not allowed."));
  }

  const [students, total] = await Promise.all([
    Enrollment.find({ course: courseId })
      .populate("student", "name email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Enrollment.countDocuments({ course: courseId }),
  ]);

  return res.json(
    jsend.success({
      students, // ← مصفوفة
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    }),
  );
});

export const checkEnrollment = asynchandler(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user._id;

  const enrollment = await Enrollment.findOne({
    course: courseId,
    student: studentId,
  });

  res.json(
    jsend.success({
      enrolled: !!enrollment,
      enrollment: enrollment || null,
    }),
  );
});
