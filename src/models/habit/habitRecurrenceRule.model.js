import mongoose from "mongoose";

const RECURRENCE_KINDS = [
  "daily",
  "every_n_days",
  "weekly",
  "monthly",
  "yearly",
  "completion_based",
  "once",
];

const habitRecurrenceRuleSchema = new mongoose.Schema(
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
    version: { type: Number, required: true, min: 1 },
    effectiveTo: { type: Date, default: null },
    kind: {
      type: String,
      enum: RECURRENCE_KINDS,
      required: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    startsOn: { type: Date, required: true },
    endsOn: { type: Date, default: null },
  },
  { timestamps: true }
);

habitRecurrenceRuleSchema.index(
  { habitTaskId: 1, version: 1 },
  { unique: true }
);
habitRecurrenceRuleSchema.index({ habitTaskId: 1, effectiveTo: 1 });

export const HabitRecurrenceRule = mongoose.model(
  "HabitRecurrenceRule",
  habitRecurrenceRuleSchema
);
export { RECURRENCE_KINDS };
