import asynchandler from "express-async-handler";
import Lesson from "../models/Lesson.model.js";
import Course from "../models/Course.model.js";
import { uploadVideoToCloudinary } from "../utils/cloudinaryVideo.js";
import jsend from "jsend";
import fs from "fs";

export const getLessons = asynchandler(async (req, res) => {
  const lessons = await Lesson.find({
    course: req.params.courseId,
  }).sort("order");
  if (!lessons || lessons.length === 0) {
    return res
      .status(404)
      .json(jsend.error("lessons not found for this course"));
  }

  res.json(jsend.success(lessons));
});
export const getLessonById = asynchandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) {
    res.status(404).json(jsend.error("course not found"));
  }
  res.json(jsend.success(lesson));
});

export const createLesson = asynchandler(async (req, res) => {
  console.log(req.file);
  if (!req.file) {
    return res.status(400).json(jsend.error("video not found"));
  }

  const course = await Course.findById(req.body.course);

  if (!course) {
    return res.status(404).json(jsend.error("course not found"));
  }

  if (course.instructor.toString() !== req.user._id.toString()) {
    return res.status(403).json(jsend.error("user not instructor"));
  }
  console.log(req.file);
  const result = await uploadVideoToCloudinary(req.file.path);

  const lesson = await Lesson.create({
    ...req.body,
    video: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });

  // حذف الملف المؤقت
  fs.unlinkSync(req.file.path);

  res.status(200).json(jsend.success(lesson));
});

export const updateLesson = asynchandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).populate("course");

  if (!lesson) {
    return res.status(404).json(jsend.error("lesson not found"));
  }

  if (lesson.course.instructor.toString() !== req.user._id.toString()) {
    return res.status(403).json(jsend.error("not allow"));
  }

  lesson.title = req.body.title ?? lesson.title;
  lesson.content = req.body.content ?? lesson.content;
  const result = await uploadVideoToCloudinary(req.file.path);
  lesson.video = {
    url: result.secure_url,
    publicId: result.public_id,
  };

  await lesson.save();
  res.json(jsend.success(lesson));
});

export const deleteLesson = asynchandler(async (req, res) => {
  await Lesson.findByIdAndDelete(req.params.id);
  res.json(jsend.success("lesson det.."));
});
