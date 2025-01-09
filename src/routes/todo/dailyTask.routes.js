import { Router } from "express";
import { createDailyTask, deleteDailyTask, getOwnerDailyTask } from "../../controllers/todo/dailyTask.controller.js";

const router = Router();

router
  .route("/")
  .post(createDailyTask);

router
  .route("/:owner")
  .get(getOwnerDailyTask);


router
  .route("/:owner/:dailyTaskId")
  .delete(deleteDailyTask);

export default router;