import mongoose, { Schema } from "mongoose";
import { z } from "zod";
import { mongoIdSchema } from "../global.models.js";

export const DailyTaskZodSchema = z.object({
  owner: z.string().nonempty("Owner is required"),
  title: z.string().nonempty("Title is required"),
  isActive: z.optional(z.boolean()),
});

export const DeleteDailyTaskZodSchema = z.object({
  owner: z.string().nonempty("Owner is required"),
  dailyTaskId: mongoIdSchema
})

const dailyTaskSchema = new Schema(
  {
    owner: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      index: true,
    },
    isActive:{
      type: Boolean,
      required: false,
      default: true
    }
  },
  { timestamps: true }
);

export const DailyTask = mongoose.model("dailyTask", dailyTaskSchema);
