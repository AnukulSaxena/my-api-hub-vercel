import { FetchTaskCompletionSchema, TaskCompletion, TaskCompletionZodSchema } from "../../models/todo/taskCompletion.models.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";


export const createTaskCompletion = asyncHandler(async (req, res) => {
    const newTaskCompletion = new TaskCompletion(TaskCompletionZodSchema.parse(req.body));
    await newTaskCompletion.save();
  
    return res
      .status(201)
      .json(new ApiResponse(201, newTaskCompletion, "Task Completion created successfully"));
  });


  export const fetchTaskCompletionsByDate = asyncHandler(async (req, res) => {
    const { owner, date } = FetchTaskCompletionSchema.parse(req.params);
  
    // Parse the provided date into a Date object
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
  
    const taskCompletions = await TaskCompletion.find({
      owner,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    }).populate('taskId'); // Populate task details if needed
  
    return res
      .status(200)
      .json(new ApiResponse(200, taskCompletions, "Task Completions fetched successfully"));
  });