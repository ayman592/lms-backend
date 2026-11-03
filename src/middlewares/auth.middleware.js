import User from "../models/User.model.js";
import jsend from "jsend";
import { verifyAccessToken } from "../utils/jwt.js";
import { getRedisClient } from "../config/redis.js";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : req.cookies?.token;

  if (!token) {
    return res.status(401).json(jsend.error("Unauthorized: No token provided"));
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return res
      .status(401)
      .json(jsend.error("Unauthorized: Invalid or expired token"));
  }

  if (decoded.type !== "access" || typeof decoded.sid !== "string") {
    return res
      .status(401)
      .json(jsend.error("Unauthorized: Invalid token type"));
  }

  const sessionUserId = await getRedisClient().get(
    `auth:access:${decoded.sid}`,
  );

  if (!sessionUserId || sessionUserId !== decoded.id) {
    return res.status(401).json(jsend.error("Unauthorized: Session expired"));
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user)
    return res.status(401).json(jsend.error("Unauthorized: User not found"));
  if (user.isSuspended)
    return res.status(403).json(jsend.error("Account suspended"));

  req.authSessionId = decoded.sid;
  req.user = user;
  next();
};

export { authMiddleware };
