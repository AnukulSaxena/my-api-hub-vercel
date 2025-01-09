import { Router } from "express";
import { createTaskCompletion, fetchTaskCompletionsByDate } from "../../controllers/todo/taskCompletion.controller.js";


const router = Router();

router
  .route("/")
  .post(createTaskCompletion);

router
  .route("/:owner/:date")
  .get(fetchTaskCompletionsByDate);

export default router;