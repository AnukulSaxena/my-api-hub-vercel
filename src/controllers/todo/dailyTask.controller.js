import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  DailyTask,
  DailyTaskZodSchema,
  DeleteDailyTaskZodSchema,
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

export const deleteDailyTask = asyncHandler(async (req, res) => {
  const { owner, dailyTaskId } = DeleteDailyTaskZodSchema.parse(req.params);

  const deletionResult = await DailyTask.deleteOne({ _id: dailyTaskId, owner });

  if (deletionResult.deletedCount === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Daily task not found or not owned by the specified user"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Daily task deleted successfully"));
});

