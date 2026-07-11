import jwt from "jsonwebtoken";

export const generateToken = (id, role, name) => {
  return jwt.sign({ id, role, name }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};
