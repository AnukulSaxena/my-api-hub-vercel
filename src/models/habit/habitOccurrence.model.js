import mongoose from "mongoose";

const OCCURRENCE_STATUSES = ["pending", "completed", "missed", "skipped"];

const habitOccurrenceSchema = new mongoose.Schema(
  {
    habitTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HabitTask",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recurrenceRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HabitRecurrenceRule",
      required: true,
    },
    recurrenceRuleVersion: { type: Number, required: true },
    scheduledStartAt: { type: Date, required: true, index: true },
    scheduledEndAt: { type: Date, required: true, index: true },
    occurrenceKey: { type: String, required: true },
    status: {
      type: String,
      enum: OCCURRENCE_STATUSES,
      default: "pending",
      index: true,
    },
    completedAt: { type: Date, default: null },
    completedOnTime: { type: Boolean, default: null },
    skippedAt: { type: Date, default: null },
    missedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

habitOccurrenceSchema.index(
  { habitTaskId: 1, occurrenceKey: 1 },
  { unique: true }
);
habitOccurrenceSchema.index({ userId: 1, scheduledStartAt: 1 });
habitOccurrenceSchema.index({ habitTaskId: 1, scheduledStartAt: 1 });
habitOccurrenceSchema.index({ status: 1, scheduledEndAt: 1 });

export const HabitOccurrence = mongoose.model(
  "HabitOccurrence",
  habitOccurrenceSchema
);
export { OCCURRENCE_STATUSES };
