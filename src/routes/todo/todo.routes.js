import { Router } from "express";

import {
  createTodo,
  deleteTodo,
  getAllTodos,
  createSingleTodo,
  deleteSingleTodo,
  //   getTodoById,
  //   toggleTodoDoneStatus,
  //   updateTodo,
} from "../../controllers/todo/todo.controllers.js";
import {
  createTodoValidator,
  queryValidator,
  bodyValidator,
  updateTodoValidator,
} from "../../validators/todo/todo.validators.js";
import { mongoIdPathVariableValidator } from "../../validators/common/mongodb.validators.js";
import { validate } from "../../validators/validate.js";

const router = Router();

function check(req, res, next) {
  console.log(req.body, "something");
  next();
}

router
  .route("/")
  .post(check, createTodoValidator(), validate, createTodo)
  .get(queryValidator("owner"), validate, getAllTodos);

router
  .route("/todo/:todoId")
  .post(
    mongoIdPathVariableValidator("todoId"),
    bodyValidator("todo"),
    validate,
    createSingleTodo
  )
  .delete(
    mongoIdPathVariableValidator("todoId"),
    queryValidator("index"),
    validate,
    deleteSingleTodo
  );

router
  .route("/:todoId")
  .delete(mongoIdPathVariableValidator("todoId"), validate, deleteTodo);
//   .get(mongoIdPathVariableValidator("todoId"), validate, getTodoById)
//   .patch(
//     mongoIdPathVariableValidator("todoId"),
//     updateTodoValidator(),
//     validate,
//     updateTodo
//   )

// router
//   .route("/toggle/status/:todoId")
//   .patch(
//     mongoIdPathVariableValidator("todoId"),
//     validate,
//     toggleTodoDoneStatus
//   );

export default router;
