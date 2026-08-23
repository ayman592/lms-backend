import User from "../models/User.model.js";
import asynchandler from "express-async-handler";
import jsend from "jsend";
import { generateToken } from "../utils/jwt.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/sendEmail.js";
import { uploadImageToCloudinary } from "../utils/cloudinaryVideo.js";

export const register = asynchandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.exists({ email });

  if (userExists) {
    return res.status(409).json(jsend.error("User already exists"));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let profilePicture = null;

  if (req.file) {
    const result = await uploadImageToCloudinary(req.file.path);

    profilePicture = {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    profilePicture,
    role: "student",
  });

  const token = generateToken(user._id, user.role, user.name);

  res.cookie("token", token, {
    maxAge: 3600000,
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  });

  res.status(201).json(
    jsend.success({
      user,
      token,
    }),
  );
});

export const login = asynchandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json(jsend.error("user not found"));
  }
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    return res.status(400).json(jsend.error("invalid password"));
  }
  const token = generateToken(user._id, user.role, user.name);

  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 3600000,
    secure: false,
  });

  res.json(jsend.success({ user, token }));
});

export const changePassword = asynchandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json(jsend.error("user not found"));
  }

  const matchPassword = await bcrypt.compare(currentPassword, user.password);
  if (!matchPassword) {
    return res.status(404).json(jsend.error("current password is incorrect"));
  }

  user.password = newPassword;
  await user.save();

  res.json(jsend.success("password change succ.."));
});

export const forgotPassword = asynchandler(async (req, res) => {
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json(jsend.error("user not found"));
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await sendEmail(email, otp);
  user.otp = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  await user.save();
  res.json(jsend.success("otp send to email"));
});

export const resetPassword = asynchandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });

  if (
    !user ||
    user.otp !== otp ||
    !user.otpExpiry ||
    user.otpExpiry < Date.now()
  ) {
    return res.status(404).json(jsend.error("invalid OTP"));
  }

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpiry = undefined;

  await user.save();

  res.json(
    jsend.success({
      message: "password reset success.",
    }),
  );
});

export const logout = asynchandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.json(
    jsend.success({
      message: "Logged out success.",
    }),
  );
});

export const getMe = asynchandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -__v");
  if (!user) {
    return res.status(404).json(jsend.error("user not found"));
  }

  res.json(
    jsend.success({
      user,
    }),
  );
});

export const updateProfile = asynchandler(async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json(jsend.error("user not found"));
  }

  if (email && email !== user.email) {
    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(409).json(jsend.error("email already exists"));
    }
  }
  const result = await uploadImageToCloudinary(req.file.path);

  user.name = name ?? user.name;
  user.email = email ?? user.email;
  ((user.profilePicture =
    {
      url: result.secure_url,
      publicId: result.public_id,
    } ?? user.profilePicture),
    await user.save());

  res.json(
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
