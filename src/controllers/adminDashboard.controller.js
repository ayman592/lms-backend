import asynchandler from "express-async-handler";
import User from "../models/User.model.js";
import Course from "../models/Course.model.js";
import jsend from "jsend";
import Enrollment from "../models/Enrollment.model.js";
import bcrypt from "bcryptjs";

// ======================================================
// Dashboard
// ======================================================
export const adminDashboard = asynchandler(async (req, res) => {
  const [
    totalUsers,
    totalCourses,
    totalInstructors,
    totalStudents,
    totalEnrollments,
    totalPublishedCourses,
    totalDraftCourse,
    latestUsers,
    latestCourses,
  ] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    User.countDocuments({ role: "instructor" }),
    User.countDocuments({ role: "student" }),
    Enrollment.countDocuments(),
    Course.countDocuments({ status: "published" }),
    Course.countDocuments({ status: "draft" }),
    User.find()
      .sort({ createdAt: -1 })
      .limit(9)
      .select("-password -__v")
      .lean(),
    Course.find()
      .sort({ createdAt: -1 })
      .limit(9)
      .populate("instructor", "name email profilePicture")
      .lean(),
  ]);

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

// ======================================================
// Create Instructor
// ======================================================
export const createInstructor = asynchandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json(jsend.error("Name, email and password are required."));
  }

  const existingUser = await User.findOne({ email });

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

// ======================================================
// Suspend User
// ======================================================
export const suspendUser = asynchandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { isSuspended: true },
    { new: true },
  ).select("-password -__v");

  if (!user) {
    return res.status(404).json(jsend.error("User not found"));
  }

  // ✅ إرجاع isActive عشان الـ Frontend يفهم
  res.json(
    jsend.success({
      ...user.toObject(),
      isActive: !user.isSuspended,
    }),
  );
});

// ======================================================
// Activate User
// ======================================================
export const activateUser = asynchandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { isSuspended: false },
    { new: true },
  ).select("-password -__v");

  if (!user) {
    return res.status(404).json(jsend.error("User not found"));
  }

  res.json(
    jsend.success({
      ...user.toObject(),
      isActive: !user.isSuspended,
    }),
  );
});

// ======================================================
// Delete User
// ======================================================
export const deleteUser = asynchandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    return res.status(404).json(jsend.error("User not found"));
  }

  res.json(jsend.success("User deleted successfully"));
});

// ======================================================
// Get All Users (Pagination + Search + Filter)
// ======================================================
export const getAllUsers = asynchandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;
  const search = req.query.search?.trim() || "";
  const filter = req.query.filter || "all";

  const query = {};

  // بحث في الاسم أو البريد
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  // فلترة حسب الدور
  if (["instructor", "student", "admin"].includes(filter)) {
    query.role = filter;
  }

  // ✅ Promise.all لجلب البيانات والعدد بالتوازي
  const [users, totalUsers] = await Promise.all([
    User.find(query)
      .select("-password -__v")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .lean(),
    User.countDocuments(query),
  ]);

  // ✅ إضافة isActive لكل مستخدم
  const usersWithActive = users.map((u) => ({
    ...u,
    isActive: !u.isSuspended,
  }));

  res.json(
    jsend.success({
      users: usersWithActive,
      page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
    }),
  );
});
