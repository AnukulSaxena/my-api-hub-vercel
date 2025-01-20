import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  DailyTask,
  DailyTaskZodSchema,
  DeleteDailyTaskZodSchema,
} from "../../models/todo/dailyTask.models.js";

export const createDailyTask = asyncHandler(async (req, res) => {
  const newTask = new DailyTask(DailyTaskZodSchema.parse(req.body));
  await newTask.save();

  return res
    .status(201)
    .json(new ApiResponse(201, newTask, "Todo created successfully"));
});

export const getOwnerDailyTask = asyncHandler(async (req, res) => {
  const { owner } = req.params;
  const tasks = await DailyTask.find({ owner, isActive: true });
  return res
    .status(200)
    .json(new ApiResponse(200, tasks || [], "Owner's daily tasks fetched"));
});

export const deleteDailyTask = asyncHandler(async (req, res) => {
  const { owner, dailyTaskId } = DeleteDailyTaskZodSchema.parse(req.params);

  const dailyTask = await DailyTask.findById(dailyTaskId);
  if(!dailyTask)
    return res
  .status(404)
  .json(new ApiResponse(404, null, "Daily task not found"));

  if(dailyTask.owner !== owner){
    return res
    .status(404)
    .json(new ApiResponse(404, null, "not owned by the specified user"));
  }

  dailyTask.isActive = false;
  dailyTask.save();


  return res
    .status(200)
    .json(new ApiResponse(200, null, "Daily task deleted successfully"));
});

