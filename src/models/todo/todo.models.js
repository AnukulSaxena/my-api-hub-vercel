import mongoose, { Schema } from "mongoose";

const todoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    todoType: {
      type: String,
      default: "temp",
      enum: ["temp", "daily"],
    },
    todos: {
      type: [String], // Array of strings
      default: [], // Default value is an empty array
    },
    owner: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Todo = mongoose.model("Todo", todoSchema);
