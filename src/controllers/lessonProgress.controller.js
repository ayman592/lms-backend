import mongoose from "mongoose";
import asyncHandler from "express-async-handler";

import LessonProgress from "../models/LessonProgress.model.js";
import Lesson from "../models/Lesson.model.js";
import Enrollment from "../models/Enrollment.model.js";
import jsend from "jsend";

// استخراج ID الطالب من المستخدم المسجل
const getStudentId = (req) => {
  return req.user?._id || req.user?.id;
};

// التحقق من صحة MongoDB ObjectId
const isValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// التحقق من اشتراك الطالب في الكورس
const getActiveEnrollment = async (studentId, courseId) => {
  return Enrollment.findOne({
    student: studentId,
    course: courseId,
    status: "enrolled",
  });
};

// تحديث نسبة تقدم الكورس
const updateCourseProgress = async (studentId, courseId) => {
  const enrollment = await getActiveEnrollment(studentId, courseId);

  if (!enrollment) {
    return null;
  }

  // عدد الدروس الفعلية غير المحذوفة
  const totalLessons = await Lesson.countDocuments({
    course: courseId,
  });

  // لا توجد دروس في الكورس
  if (totalLessons === 0) {
    enrollment.progress = 0;
    await enrollment.save();

    return {
      progress: 0,
      totalLessons: 0,
      completedLessons: 0,
    };
  }

  // عدد الدروس المكتملة التابعة للكورس
  const completedLessons = await LessonProgress.countDocuments({
    student: studentId,
    course: courseId,
    isCompleted: true,
    lesson: {
      $in: await Lesson.find({
        course: courseId,
      }).distinct("_id"),
    },
  });

  const progress = Math.round((completedLessons / totalLessons) * 100);

  enrollment.progress = Math.min(100, progress);

  await enrollment.save();

  return {
    progress: enrollment.progress,
    totalLessons,
    completedLessons,
  };
};

// جلب تقدم الطالب في كورس
// في lessonProgress.controller.js
export const getCourseProgress = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user._id;

  const totalLessons = await Lesson.countDocuments({ course: courseId });

  const progressList = await LessonProgress.find({
    student: studentId,
    course: courseId,
  });

  const completedLessons = progressList.filter((p) => p.isCompleted).length;

  const percentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return res.json(
    jsend.success({
      totalLessons,
      completedLessons,
      percentage,
      lessonsProgress: progressList, // ✅ كل الدروس مرة واحدة
    }),
  );
};

// جلب تقدم الطالب في درس
export const getLessonProgress = asyncHandler(async (req, res) => {
  const studentId = getStudentId(req);
  const { lessonId } = req.params;

  if (!studentId) {
    return res.status(401).json(jsend.error("Authentication required"));
  }

  if (!isValidId(lessonId)) {
    return res.status(400).json(jsend.error("Invalid lesson ID"));
  }

  const lesson = await Lesson.findOne({
    _id: lessonId,
    isDeleted: false,
  }).select("_id course");

  if (!lesson) {
    return res.status(404).json(jsend.error("Lesson not found"));
  }

  const enrollment = await getActiveEnrollment(studentId, lesson.course);

  if (!enrollment) {
    return res
      .status(403)
      .json(jsend.error("You are not enrolled in this course"));
  }

  const progress = await LessonProgress.findOne({
    student: studentId,
    lesson: lessonId,
  });

  res.status(200).json(
    jsend.success({
      lessonId,
      courseId: lesson.course,
      isCompleted: progress?.isCompleted ?? false,
      lastPosition: progress?.lastPosition ?? 0,
      duration: progress?.duration ?? 0,
      completedAt: progress?.completedAt ?? null,
    }),
  );
});

// حفظ موضع الفيديو
export const saveLessonProgress = asyncHandler(async (req, res) => {
  const studentId = getStudentId(req);
  const { lessonId } = req.params;

  const { lastPosition, duration } = req.body;

  if (!studentId) {
    return res.status(401).json(jsend.error("Authentication required"));
  }

  if (!isValidId(lessonId)) {
    return res.status(400).json(jsend.error("Invalid lesson ID"));
  }

  if (!Number.isFinite(lastPosition) || lastPosition < 0) {
    return res
      .status(400)
      .json(jsend.error("lastPosition must be a non-negative number"));
  }

  if (duration !== undefined && (!Number.isFinite(duration) || duration < 0)) {
    return res
      .status(400)
      .json(jsend.error("duration must be a non-negative number"));
  }

  const lesson = await Lesson.findOne({
    _id: lessonId,
    isDeleted: false,
  }).select("_id course");

  if (!lesson) {
    return res.status(404).json(jsend.error("Lesson not found"));
  }

  const enrollment = await getActiveEnrollment(studentId, lesson.course);

  if (!enrollment) {
    return res
      .status(403)
      .json(jsend.error("You are not enrolled in this course"));
  }

  const update = {
    $max: {
      lastPosition,
    },
    $setOnInsert: {
      student: studentId,
      course: lesson.course,
      lesson: lessonId,
    },
  };

  if (duration !== undefined) {
    update.$max.duration = duration;
  }

  const progress = await LessonProgress.findOneAndUpdate(
    {
      student: studentId,
      lesson: lessonId,
    },
    update,
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  res.status(200).json(
    jsend.success({
      lessonId,
      isCompleted: progress.isCompleted,
      lastPosition: progress.lastPosition,
      duration: progress.duration,
      completedAt: progress.completedAt,
    }),
  );
});

// تسجيل إكمال الدرس
export const completeLesson = asyncHandler(async (req, res) => {
  const studentId = getStudentId(req);
  const { lessonId } = req.params;

  if (!studentId) {
    return res.status(401).json(jsend.error("Authentication required"));
  }

  if (!isValidId(lessonId)) {
    return res.status(400).json(jsend.error("Invalid lesson ID"));
  }

  const lesson = await Lesson.findOne({
    _id: lessonId,
    isDeleted: false,
  }).select("_id course");

  if (!lesson) {
    return res.status(404).json(jsend.error("Lesson not found"));
  }

  const enrollment = await getActiveEnrollment(studentId, lesson.course);

  if (!enrollment) {
    return res
      .status(403)
      .json(jsend.error("You are not enrolled in this course"));
  }

  const progress = await LessonProgress.findOneAndUpdate(
    {
      student: studentId,
      lesson: lessonId,
    },
    {
      $set: {
        isCompleted: true,
        completedAt: new Date(),
      },
      $setOnInsert: {
        student: studentId,
        course: lesson.course,
        lesson: lessonId,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  const summary = await updateCourseProgress(studentId, lesson.course);

  res.status(200).json(
    jsend.success({
      lessonId,
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt,
      progress: summary.progress,
      totalLessons: summary.totalLessons,
      completedLessons: summary.completedLessons,
    }),
  );
});
