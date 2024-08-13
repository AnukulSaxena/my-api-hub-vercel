import { asyncHandler } from "../../utils/asyncHandler.js";
import { Todo } from "../../models/todo/todo.models.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const createTodo = asyncHandler(async (req, res) => {
  const { title, description, owner } = req.body;
  console.log(req.body);
  const todo = await Todo.create({
    title,
    description,
    owner,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, todo, "Todo created successfully"));
});

const deleteTodo = asyncHandler(async (req, res) => {
  const { todoId } = req.params;
  const todo = await Todo.findByIdAndDelete(todoId);

  if (!todo) {
    throw new ApiError(404, "Todo does not exist");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, { deletedTodo: todo }, "Todo deleted successfully")
    );
});

const createSingleTodo = asyncHandler(async (req, res) => {
  const { todoId } = req.params;
  const { todo } = req.body;
  const todoItem = await Todo.findById(todoId);

  if (!todoItem) {
    throw new ApiError(404, "Todo does not exist");
  }
  todoItem.todos.push(todo);

  await todoItem.save();

  return res
    .status(201)
    .json(new ApiResponse(201, todoItem, "Todo created successfully"));
});

const deleteSingleTodo = asyncHandler(async (req, res) => {
  const { todoId } = req.params;
  const { index } = req.query;
  const todo = await Todo.findById(todoId);

  if (!todo) {
    throw new ApiError(404, "Todo does not exist");
  }

  const idx = parseInt(index);

  if (idx < 0 || idx >= todo.todos.length) {
    throw new ApiError(400, "Invalid index");
  }

  todo.todos.splice(idx, 1);

  await todo.save();

  return res
    .status(200)
    .json(new ApiResponse(200, todo, "Todo deleted successfully"));
});

const getAllTodos = asyncHandler(async (req, res) => {
  const { query, complete, owner } = req.query;

  const todos = await Todo.find({ owner });

  return res
    .status(200)
    .json(new ApiResponse(200, todos, "Todos fetched successfully"));
});

export {
  createTodo,
  getAllTodos,
  deleteTodo,
  createSingleTodo,
  deleteSingleTodo,
};
