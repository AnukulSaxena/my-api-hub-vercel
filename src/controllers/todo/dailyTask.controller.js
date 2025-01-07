import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  DailyTask,
  DailyTaskZodSchema,
} from "../../models/todo/dailyTask.models.js";

export const createDailyTask = asyncHandler(async (req, res) => {
  DailyTaskZodSchema.parse(req.body);
  const newTask = new DailyTask(req.body);
  await newTask.save();

  return res
    .status(201)
    .json(new ApiResponse(201, newTask, "Todo created successfully"));
});

export const getOwnerDailyTask = asyncHandler(async (req, res) => {
  const { owner } = req.params;
  const tasks = await DailyTask.find({ owner });
  return res
    .status(200)
    .json(new ApiResponse(200, tasks || [], "Owner's daily tasks fetched"));
});
