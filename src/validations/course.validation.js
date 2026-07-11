import { body, param, query } from "express-validator";

export const validateCreateCourse = [
  body("title").trim().notEmpty().withMessage("title is required"),
  body("description").trim().notEmpty().withMessage("description is required"),
  body("category").trim().notEmpty().withMessage("category is required"),
];
export const validateUpdateCourse = [
  body("title").trim().notEmpty().withMessage("title is required"),
  body("description").trim().notEmpty().withMessage("description is required"),
  body("category").trim().notEmpty().withMessage("category is required"),
  param("id").isMongoId().withMessage("Invalid course ID"),
];
export const validateDeleteCourse = [
  param("id").isMongoId().withMessage("Invalid course ID"),
];

export const validateGetCourseById = [
  param("id").isMongoId().withMessage("Invalid course ID"),
];

export const validateGetCourses = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
];

export const validateSearchCourses = [
  query("query").trim().notEmpty().withMessage("Search query is required"),
];
