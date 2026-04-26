import mongoose from "mongoose";

const ACTOR_TYPES = ["user", "system"];
const EVENT_REASONS = [
  "user_completed",
  "user_skipped",
  "deadline_passed",
  "rule_changed",
  "materialized",
  "completion_spawned_next",
];

const habitOccurrenceEventSchema = new mongoose.Schema(
  {
    occurrenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HabitOccurrence",
      required: true,
      index: true,
    },
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
    },
    fromStatus: { type: String, default: null },
    toStatus: { type: String, required: true },
    at: { type: Date, default: () => new Date() },
    actorType: {
      type: String,
      enum: ACTOR_TYPES,
      default: "user",
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reason: {
      type: String,
      enum: EVENT_REASONS,
      required: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: false }
);

habitOccurrenceEventSchema.index({ occurrenceId: 1, at: 1 });

export const HabitOccurrenceEvent = mongoose.model(
  "HabitOccurrenceEvent",
  habitOccurrenceEventSchema
);
export { ACTOR_TYPES, EVENT_REASONS };
