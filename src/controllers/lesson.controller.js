import asynchandler from "express-async-handler";

import Lesson from "../models/Lesson.model.js";
import Course from "../models/Course.model.js";

import {
  addClient,
  removeClient,
  sendProgress,
  clearUpload,
} from "../utils/uploadProgress.js";

import { uploadVideoToCloudinary } from "../utils/cloudinaryVideo.js";

import jsend from "jsend";
import fs from "fs";

// ======================================================
// GET ALL LESSONS
// ======================================================

export const getLessons = asynchandler(async (req, res) => {
  const lessons = await Lesson.find({
    course: req.params.courseId,
  }).sort("order");

  if (!lessons || lessons.length === 0) {
    return res
      .status(404)
      .json(jsend.error("lessons not found for this course"));
  }

  return res.json(jsend.success(lessons));
});

// ======================================================
// GET LESSON BY ID
// ======================================================

export const getLessonById = asynchandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId);

  if (!lesson) {
    return res.status(404).json(jsend.error("lesson not found"));
  }

  return res.json(jsend.success(lesson));
});

// ======================================================
// CREATE LESSON
// ======================================================

export const createLesson = asynchandler(async (req, res) => {
  console.log("FILE:", req.file);
  console.log("BODY:", req.body);

  const uploadId = req.body.uploadId;

  // ==================================================
  // CHECK UPLOAD ID
  // ==================================================

  if (!uploadId) {
    return res.status(400).json(jsend.error("uploadId is required"));
  }

  // ==================================================
  // CHECK VIDEO
  // ==================================================

  if (!req.file) {
    return res.status(400).json(jsend.error("video not found"));
  }

  // ==================================================
  // CHECK COURSE
  // ==================================================

  const course = await Course.findById(req.body.course);

  if (!course) {
    return res.status(404).json(jsend.error("course not found"));
  }

  try {
    // ==================================================
    // CLOUDINARY START
    // ==================================================

    sendProgress(uploadId, {
      stage: "cloudinary",
      progress: 0,
      message: "Uploading video to Cloudinary...",
    });

    // ==================================================
    // CLOUDINARY UPLOAD
    // ==================================================

    const result = await uploadVideoToCloudinary(
      req.file.path,

      ({ progress, uploadedBytes, totalBytes }) => {
        sendProgress(uploadId, {
          stage: "cloudinary",
          progress,
          uploadedBytes,
          totalBytes,
          message: "Uploading video to Cloudinary...",
        });
      },
    );

    // ==================================================
    // CLOUDINARY COMPLETED
    // ==================================================

    sendProgress(uploadId, {
      stage: "saving",
      progress: 100,
      message: "Cloudinary upload completed. Saving lesson...",
    });

    // ==================================================
    // CREATE LESSON
    // ==================================================

    const lesson = await Lesson.create({
      ...req.body,

      instructor: req.user._id,

      video: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });

    // ==================================================
    // DELETE TEMP FILE
    // ==================================================

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // ==================================================
    // COMPLETED
    // ==================================================

    sendProgress(uploadId, {
      stage: "completed",
      progress: 100,
      message: "Lesson created successfully.",
    });

    // ==================================================
    // CLOSE SSE
    // ==================================================

    setTimeout(() => {
      clearUpload(uploadId);
    }, 500);

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json(jsend.success(lesson));
  } catch (error) {
    // ==================================================
    // DELETE TEMP FILE ON ERROR
    // ==================================================

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // ==================================================
    // SEND ERROR
    // ==================================================

    sendProgress(uploadId, {
      stage: "error",
      progress: 0,
      message: error?.message || "Video upload failed",
    });

    // ==================================================
    // CLOSE SSE
    // ==================================================

    clearUpload(uploadId);

    throw error;
  }
});

// ======================================================
// UPDATE LESSON
// ======================================================

export const updateLesson = asynchandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId).populate("course");

  // ==================================================
  // CHECK LESSON
  // ==================================================

  if (!lesson) {
    return res.status(404).json(jsend.error("lesson not found"));
  }

  // ==================================================
  // CHECK INSTRUCTOR
  // ==================================================

  if (lesson.course.instructor.toString() !== req.user._id.toString()) {
    return res.status(403).json(jsend.error("not allow"));
  }

  // ==================================================
  // UPDATE TEXT DATA
  // ==================================================

  lesson.title = req.body.title ?? lesson.title;

  lesson.description = req.body.description ?? lesson.description;

  lesson.order = req.body.order ?? lesson.order;

  lesson.duration = req.body.duration ?? lesson.duration;

  lesson.isPreview = req.body.isPreview ?? lesson.isPreview;

  // ==================================================
  // UPDATE VIDEO
  // ==================================================

  if (req.file) {
    const result = await uploadVideoToCloudinary(req.file.path);

    lesson.video = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    // Delete temporary file

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }

  // ==================================================
  // SAVE
  // ==================================================

  await lesson.save();

  // ==================================================
  // RESPONSE
  // ==================================================

  return res.json(jsend.success(lesson));
});

// ======================================================
// DELETE LESSON
// ======================================================

export const deleteLesson = asynchandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId);

  if (!lesson) {
    return res.status(404).json(jsend.error("lesson not found"));
  }

  await Lesson.findByIdAndDelete(req.params.lessonId);

  return res.json(jsend.success("lesson deleted successfully"));
});

// ======================================================
// UPLOAD PROGRESS - SSE
// ======================================================

export const uploadProgress = asynchandler(async (req, res) => {
  const { uploadId } = req.params;

  // ==================================================
  // CHECK UPLOAD ID
  // ==================================================

  if (!uploadId) {
    return res.status(400).json({
      success: false,
      message: "uploadId is required",
    });
  }

  // ==================================================
  // SSE HEADERS
  // ==================================================

  res.setHeader("Content-Type", "text/event-stream");

  res.setHeader("Cache-Control", "no-cache, no-transform");

  res.setHeader("Connection", "keep-alive");

  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders();

  // ==================================================
  // CONNECTED
  // ==================================================

  res.write(": connected\n\n");

  addClient(uploadId, res);

  // ==================================================
  // INITIAL STATE
  // ==================================================

  res.write(
    `data: ${JSON.stringify({
      stage: "waiting",
      progress: 0,
      message: "Waiting for upload...",
    })}\n\n`,
  );

  // ==================================================
  // CLIENT DISCONNECTED
  // ==================================================

  req.on("close", () => {
    removeClient(uploadId, res);
  });
});
