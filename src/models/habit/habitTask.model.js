import mongoose from "mongoose";

const DEFINITION_STATUSES = ["active", "paused", "archived"];

const habitTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    priority: { type: Number, default: 0, min: 0, max: 10 },
    tags: { type: [String], default: [] },
    timezone: { type: String, default: "UTC", trim: true },
    definitionStatus: {
      type: String,
      enum: DEFINITION_STATUSES,
      default: "active",
      index: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

habitTaskSchema.index({ userId: 1, definitionStatus: 1 });

export const HabitTask = mongoose.model("HabitTask", habitTaskSchema);
export { DEFINITION_STATUSES };
