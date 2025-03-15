import mongoose, { Schema } from "mongoose";

const stackItemSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
      lowercase: true,
    },
  },
  { timestamps: true } // This will automatically add createdAt and updatedAt fields
);

export const StackItem = mongoose.model("StackItem", stackItemSchema);
