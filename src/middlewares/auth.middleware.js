import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import jsend from "jsend";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(jsend.error("Unauthorized: No token provided"));
    }

    const token = authHeader.split(" ")[1] || req.cookies.token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json(jsend.error("Unauthorized: User not found"));
    }
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json(jsend.error("Unauthorized: Invalid token" + error.message));
  }
};

export { authMiddleware };
