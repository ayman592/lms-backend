import jsend from "jsend";
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json(jsend.error("Unauthorized: User not authenticated"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json(
          jsend.error(
            "Forbidden: You do not have permission to access this resource",
          ),
        );
    }

    next();
  };
};

export default roleMiddleware;
