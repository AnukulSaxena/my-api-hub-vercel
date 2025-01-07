import mongoose, { Schema } from "mongoose";
import { z } from "zod";

export const DailyTaskZodSchema = z.object({
    owner: z.string().nonempty("Owner is required"),
    title: z.string().nonempty("Title is required"),
  });

const dailyTaskSchema = new Schema(
  {
    owner: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const DailyTask = mongoose.model("dailyTask", dailyTaskSchema);
