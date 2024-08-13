import { body, query } from "express-validator";

const queryValidator = (queryItem) => {
  return [
    query(`${queryItem}`)
      .trim()
      .toLowerCase()
      .notEmpty()
      .withMessage("Todo title is required"),
  ];
};

const bodyValidator = (bodyItem) => {
  console.log(bodyItem, "me here");
  return [
    body(`${bodyItem}`).trim().notEmpty().withMessage("Todo is required"),
  ];
};

const createTodoValidator = () => {
  return [
    body("title").trim().notEmpty().withMessage("Todo title is required"),
    body("description").optional().trim(),
    body("owner").optional().trim().toLowerCase(),
  ];
};

const updateTodoValidator = () => {
  return [
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Todo title is required"),
    body("description")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Todo title is required"),
  ];
};

export {
  createTodoValidator,
  updateTodoValidator,
  queryValidator,
  bodyValidator,
};
