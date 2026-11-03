import jwt from "jsonwebtoken";

const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";

export const generateAccessToken = ({ id, role, name, sid }) => {
  return jwt.sign(
    { id, role, name, sid, type: "access" },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES },
  );
};

export const generateRefreshToken = ({ id, sid }) => {
  return jwt.sign(
    { id, sid, type: "refresh" },
    process.env.JWT_REFRESH_SECRET || process.env.REFRESH_JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES },
  );
};

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || process.env.REFRESH_JWT_SECRET,
  );
