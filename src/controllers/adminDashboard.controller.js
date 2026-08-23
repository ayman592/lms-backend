import asynchandler from "express-async-handler";
import User from "../models/User.model.js";
import Course from "../models/Course.model.js";
import jsend from "jsend";
import Enrollment from "../models/Enrollment.model.js";
import bcrypt from "bcryptjs";

export const adminDashboard = asynchandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalCourses = await Course.countDocuments();
  const totalInstructors = await User.countDocuments({ role: "instructor" });
  const totalStudents = await User.countDocuments({ role: "student" });
  const totalEnrollments = await Enrollment.countDocuments();
  const totalPublishedCourses = await Course.countDocuments({
    status: "published",
  });
  const totalDraftCourse = await Course.countDocuments({
    status: "draft",
  });
  const latestUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("-password -__v");
  const latestCourses = await Course.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("instructor", "name email profilePicture");

  res.json(
    jsend.success({
      totalUsers,
      totalCourses,
      totalInstructors,
      totalStudents,
      totalPublishedCourses,
      totalDraftCourse,
      totalEnrollments,
      latestUsers,
      latestCourses,
    }),
  );
});

// create instructor
export const createInstructor = asynchandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json(jsend.error("Name, email and password are required."));
  }

  const existingUser = await User.findOne({
    email,
  });

  if (existingUser) {
    return res.status(409).json(jsend.error("Email is already registered."));
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const instructor = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "instructor",
  });

  res.status(201).json(
    jsend.success({
      _id: instructor._id,
      name: instructor.name,
      email: instructor.email,
      role: instructor.role,
    }),
  );
});

// suspended user
export const suspendUser = asynchandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId).select("-password -__v");
  if (!user) {
    return res.status(404).json(jsend.error("User not found"));
  }
  user.isSuspended = true;
  await user.save();
  res.json(jsend.success(user));
});

// Activate user
export const activateUser = asynchandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId).select("-password -__v");
  if (!user) {
    return res.status(404).json(jsend.error("User not found"));
  }
  user.isSuspended = false;
  await user.save();
  res.json(jsend.success(user));
});

// delete user
export const deleteUser = asynchandler(async (req, res) => {
  const { userId } = req.params;
  await User.findByIdAndDelete(userId);
  res.json(jsend.success("User deleted successfully"));
});

export const getAllUsers = asynchandler(async (req, res) => {
  const users = await User.find().select("-password -__v");
  res.json(jsend.success(users));
});
