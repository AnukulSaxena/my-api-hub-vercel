import mongoose, { Schema } from "mongoose";

export const TaskCompletionZodSchema = z.object({
  owner: z.string().nonempty("Owner is required"),
  taskId: z
    .string()
    .nonempty("Task ID is required")
    .regex(/^[a-f\d]{24}$/, "Invalid ObjectId"),
  date: z.date(),
});

const taskCompletionSchema = new Schema(
  {
    owner: {
      type: String,
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "dailyTask",
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const TaskCompletion = mongoose.model(
  "taskCompletion",
  taskCompletionSchema
);
