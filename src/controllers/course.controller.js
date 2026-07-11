import asynchandler from "express-async-handler";
import Course from "../models/Course.model.js";
import jsend from "jsend";

export const getCourses = asynchandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const courses = await Course.find({ status: "published" })
    .populate("instructor", "name email")
    .skip(skip)
    .limit(limit);

  if (courses.length === 0) {
    return res.status(404).json(jsend.error("courses not found"));
  }

  const total = await Course.countDocuments({
    status: "published",
  });

  res.json(
    jsend.success({ courses, total, page, pages: Math.ceil(total / limit) }),
  );
});

export const getCourseDetails = asynchandler(async (req, res) => {
  const course = await Course.findOne({
    _id: req.params.id,
    status: "published",
  }).populate("instructor", "name email");

  if (!course) {
    return res.status(404).json(jsend.error("course not found."));
  }

  res.json(jsend.success({ course }));
});

export const createCourse = asynchandler(async (req, res) => {
  const course = await Course.create({
    title: req.body.title,
    description: req.body.description,
    instructor: req.user._id,
    category: req.body.category,

    status: "draft",
  });

  res.json(jsend.success({ message: "course created success..", course }));
});

export const updateCourse = asynchandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json(jsend.error("Course not found."));
  }

  if (course.instructor.toString() !== req.user._id.toString()) {
    return res.status(403).json(jsend.error("Not allowed."));
  }

  course.title = req.body.title ?? course.title;
  course.description = req.body.description ?? course.description;
  course.category = req.body.category ?? course.category;
  course.status = req.body.status ?? course.status;

  await course.save();
  res.json(jsend.success({ message: "course updated success....", course }));
});

export const deleteCourse = asynchandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json(jsend.error("corse not found."));
  }
  if (
    course.instructor.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json(jsend.error("Not allowed."));
  }

  await course.remove();
  res.json(jsend.success({ message: "course deleted success...." }));
});

export const searchCourses = asynchandler(async (req, res) => {
  const { query } = req.query;
  const courses = await Course.find({
    $text: { $search: query },
    status: "published",
  })
    .populate("instructor", "name email")
    .sort({ createdAt: -1 });

  res.json(jsend.success({ courses }));
});

export const filterCourses = asynchandler(async (req, res) => {
  const { status, category } = req.query;
  const courses = await Course.find({
    status: status || "published",
    category: category || { $exists: true },
  })
    .populate("instructor", "name email")
    .sort({ createdAt: -1 });

  res.json(jsend.success({ courses }));
});
