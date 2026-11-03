import User from "../models/User.model.js";
import asyncHandler from "express-async-handler";
import jsend from "jsend";
import {
  createAuthSession,
  rotateAuthSession,
  revokeAuthSession,
  revokeUserSessions,
} from "../utils/authSession.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/sendEmail.js";
import { uploadImageToCloudinary } from "../utils/cloudinaryVideo.js";

// ===== Cookie options =====
const REFRESH_COOKIE = "refreshToken";
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/", // مهم: يجب أن يصل إلى /api/auth/refresh
};

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_MAX_AGE,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
};

const sanitizeUser = (userDoc) => {
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  delete user.otp;
  delete user.otpExpiry;
  delete user.__v;
  return user;
};

// ===== Register =====
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json(jsend.error("User already exists"));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let profilePicture = null;
  if (req.file) {
    const result = await uploadImageToCloudinary(req.file.path);
    profilePicture = { url: result.secure_url, publicId: result.public_id };
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    profilePicture,
    role: "student",
  });

  const { accessToken, refreshToken } = await createAuthSession(user);
  setRefreshCookie(res, refreshToken);

  return res.status(201).json(
    jsend.success({
      user: sanitizeUser(user),
      accessToken,
    }),
  );
});

// ===== Login =====
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user)
    return res.status(401).json(jsend.error("Invalid email or password"));

  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword)
    return res.status(401).json(jsend.error("Invalid email or password"));

  if (user.isSuspended)
    return res.status(403).json(jsend.error("Account suspended"));

  const { accessToken, refreshToken } = await createAuthSession(user);
  setRefreshCookie(res, refreshToken);

  return res.json(
    jsend.success({
      user: sanitizeUser(user),
      accessToken,
    }),
  );
});

// ===== Refresh =====
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) return res.status(401).json(jsend.error("No refresh token"));

  try {
    const { accessToken, refreshToken } = await rotateAuthSession(token);
    setRefreshCookie(res, refreshToken);
    return res.json(jsend.success({ accessToken }));
  } catch (err) {
    clearRefreshCookie(res);
    return res
      .status(401)
      .json(jsend.error(err.message || "Invalid refresh token"));
  }
});

// ===== Logout =====
export const logout = asyncHandler(async (req, res) => {
  // authMiddleware لازم يكون شغال عشان req.user و req.authSessionId
  await revokeAuthSession(req.authSessionId, req.user._id);
  clearRefreshCookie(res);
  return res.json(jsend.success({ message: "Logged out successfully" }));
});

// ===== Change password =====
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json(jsend.error("User not found"));

  const matchPassword = await bcrypt.compare(currentPassword, user.password);
  if (!matchPassword) {
    return res.status(401).json(jsend.error("Current password is incorrect"));
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  await revokeUserSessions(user._id);
  clearRefreshCookie(res);

  return res.json(
    jsend.success({ message: "Password changed. Please log in again." }),
  );
});

// ... بقية الدوال كما هي (forgotPassword, resetPassword, getMe, updateProfile)
// فقط بدّل clearAuthCookie → clearRefreshCookie

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const normalizedEmail = email?.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    return res.json(
      jsend.success({
        message: "If the account exists, an OTP will be sent.",
      }),
    );
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));

  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await user.save();

  await sendEmail(normalizedEmail, otp);

  return res.json(
    jsend.success({
      message: "If the account exists, an OTP will be sent.",
    }),
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const normalizedEmail = email?.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (
    !user ||
    !user.otp ||
    user.otp !== otp ||
    !user.otpExpiry ||
    user.otpExpiry.getTime() < Date.now()
  ) {
    return res.status(400).json(jsend.error("Invalid or expired OTP"));
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.otp = undefined;
  user.otpExpiry = undefined;

  await user.save();

  await revokeUserSessions(user._id);

  clearRefreshCookie(res);

  return res.json(
    jsend.success({
      message: "Password reset successfully. Please log in again.",
    }),
  );
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -otp -otpExpiry -__v",
  );

  if (!user) {
    return res.status(404).json(jsend.error("User not found"));
  }

  return res.json(
    jsend.success({
      user,
    }),
  );
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json(jsend.error("User not found"));
  }

  if (email && email.trim().toLowerCase() !== user.email) {
    const normalizedEmail = email.trim().toLowerCase();

    const exists = await User.findOne({
      email: normalizedEmail,
    });

    if (exists) {
      return res.status(409).json(jsend.error("Email already exists"));
    }

    user.email = normalizedEmail;
  }

  if (name) {
    user.name = name;
  }

  if (req.file) {
    const result = await uploadImageToCloudinary(req.file.path);

    user.profilePicture = {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  await user.save();

  return res.json(
    jsend.success({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    }),
  );
});
