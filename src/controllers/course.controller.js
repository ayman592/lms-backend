import asynchandler from "express-async-handler";
import Course from "../models/Course.model.js";
import jsend from "jsend";
import { uploadImageToCloudinary } from "../utils/cloudinaryVideo.js";

export const getCourses = asynchandler(async (req, res) => {
  const {
    page = 1,
    limit = 9,
    search = "",
    category = "",
    level = "",
  } = req.query;

  const currentPage = Math.max(Number(page), 1);

  const pageLimit = Math.max(Number(limit), 1);

  const skip = (currentPage - 1) * pageLimit;

  const filter = {
    status: "published",
  };

  // Search
  if (search.trim()) {
    filter.$text = {
      $search: search.trim(),
    };
  }

  // Category
  if (category.trim()) {
    filter.category = category.trim();
  }

  // Level
  if (level.trim()) {
    filter.level = level.trim();
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate("instructor", "name email")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(pageLimit),

    Course.countDocuments(filter),
  ]);

  const pages = Math.ceil(total / pageLimit);

  res.status(200).json(
    jsend.success({
      courses,
      total,
      page: currentPage,
      pages,
    }),
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
  if (!req.file) {
    return res.status(400).json(jsend.error("image not found"));
  }
  const result = await uploadImageToCloudinary(req.file.path);
  const course = await Course.create({
    title: req.body.title,
    description: req.body.description,
    instructor: req.user._id,
    category: req.body.category,
    thumbnail: {
      url: result.secure_url,
      publicId: result.public_id,
    },

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
  const result = await uploadImageToCloudinary(req.file.path);
  course.thumbnail = {
    url: result.secure_url,
    publicId: result.public_id,
  };
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
