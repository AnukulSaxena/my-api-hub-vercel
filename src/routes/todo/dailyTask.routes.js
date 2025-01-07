import { Router } from "express";
import { createDailyTask, getOwnerDailyTask } from "../../controllers/todo/dailyTask.controller.js";

const router = Router();

router
  .route("/")
  .post(createDailyTask);

router
  .route("/:owner")
  .get(getOwnerDailyTask);

export default router;