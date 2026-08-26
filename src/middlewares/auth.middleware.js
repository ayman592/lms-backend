import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import jsend from "jsend";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : req.cookies.token;

    console.log("COOKIES:", req.cookies);
    console.log("AUTHORIZATION:", req.headers.authorization);

    if (!token) {
      return res
        .status(401)
        .json(jsend.error("Unauthorized: No token provided"));
    }
    console.log("Cookies:", req.cookies);
    console.log("Token:", req.cookies.token);
    console.log("Authorization:", req.headers.authorization);

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
