import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import { HabitOccurrence } from "../../models/habit/habitOccurrence.model.js";
import { HabitOccurrenceEvent } from "../../models/habit/habitOccurrenceEvent.model.js";
import { HabitRecurrenceRule } from "../../models/habit/habitRecurrenceRule.model.js";
import {
  addOffset,
  endOfUtcDay,
  startOfUtcDay,
  tryMaterializeNextAfterResolution,
} from "./recurrence.service.js";

/**
 * @param {object} params
 * @param {import("mongoose").Types.ObjectId} params.occurrenceId
 * @param {import("mongoose").Types.ObjectId} params.habitTaskId
 * @param {import("mongoose").Types.ObjectId} params.userId
 * @param {string | null} params.fromStatus
 * @param {string} params.toStatus
 * @param {string} params.reason
 * @param {object} [params.payload]
 * @param {string} params.actorType
 * @param {import("mongoose").Types.ObjectId | null} params.actorId
 */
export async function appendOccurrenceEvent({
  occurrenceId,
  habitTaskId,
  userId,
  fromStatus,
  toStatus,
  reason,
  payload = {},
  actorType,
  actorId,
}) {
  await HabitOccurrenceEvent.create({
    occurrenceId,
    habitTaskId,
    userId,
    fromStatus,
    toStatus,
    at: new Date(),
    actorType,
    actorId,
    reason,
    payload,
  });
}

/**
 * @param {import("mongoose").Types.ObjectId} userId
 * @param {import("mongoose").Types.ObjectId} habitTaskId
 * @param {Date} completedAt
 * @param {import("../../models/habit/habitRecurrenceRule.model.js").HabitRecurrenceRule} rule
 */
/**
 * @param {import("../../models/habit/habitOccurrence.model.js").HabitOccurrence} occ
 * @param {Date} completedAt
 * @param {import("../../models/habit/habitRecurrenceRule.model.js").HabitRecurrenceRule} rule
 */
async function spawnNextCompletionBased(occ, completedAt, rule) {
  if (rule.kind !== "completion_based") return null;
  const payload = rule.payload || {};
  const base =
    payload.anchor === "last_scheduled_start_at"
      ? occ.scheduledStartAt
      : completedAt;
  const rawNext = addOffset(base, payload.offset);
  const nextStart = startOfUtcDay(rawNext);
  const nextEnd = endOfUtcDay(rawNext);
  const key = `${occ.habitTaskId.toString()}:cb:${nextStart.getTime()}`;

  const doc = {
    habitTaskId: occ.habitTaskId,
    userId: occ.userId,
    recurrenceRuleId: rule._id,
    recurrenceRuleVersion: rule.version,
    scheduledStartAt: startOfUtcDay(nextStart),
    scheduledEndAt: nextEnd,
    occurrenceKey: key,
    status: "pending",
    completedAt: null,
    completedOnTime: null,
    skippedAt: null,
    missedAt: null,
  };

  await HabitOccurrence.updateOne(
    { habitTaskId: occ.habitTaskId, occurrenceKey: key },
    { $setOnInsert: doc },
    { upsert: true }
  );
  return HabitOccurrence.findOne({
    habitTaskId: occ.habitTaskId,
    occurrenceKey: key,
  });
}

/**
 * @param {string} userIdStr
 * @param {string} occurrenceIdStr
 * @param {{ action: 'complete'|'skip'; completedAt?: string }} body
 */
export async function transitionOccurrence(userIdStr, occurrenceIdStr, body) {
  const userId = new mongoose.Types.ObjectId(userIdStr);
  const occurrenceId = new mongoose.Types.ObjectId(occurrenceIdStr);

  const occ = await HabitOccurrence.findOne({ _id: occurrenceId, userId });
  if (!occ) {
    throw new ApiError(404, "Occurrence not found");
  }
  if (occ.status !== "pending") {
    throw new ApiError(400, "Only pending occurrences can be transitioned");
  }

  const action = body.action;
  if (action !== "complete" && action !== "skip") {
    throw new ApiError(400, "action must be complete or skip");
  }

  if (action === "skip") {
    const now = new Date();
    occ.status = "skipped";
    occ.skippedAt = now;
    await occ.save();
    await appendOccurrenceEvent({
      occurrenceId: occ._id,
      habitTaskId: occ.habitTaskId,
      userId: occ.userId,
      fromStatus: "pending",
      toStatus: "skipped",
      reason: "user_skipped",
      payload: {},
      actorType: "user",
      actorId: userId,
    });
    const ruleAfterSkip = await HabitRecurrenceRule.findOne({
      habitTaskId: occ.habitTaskId,
      effectiveTo: null,
    }).sort({ version: -1 });
    if (ruleAfterSkip && ruleAfterSkip.kind !== "completion_based") {
      await tryMaterializeNextAfterResolution(occ.habitTaskId, occ.userId);
    }
    return occ;
  }

  const completedAt = body.completedAt ? new Date(body.completedAt) : new Date();
  if (Number.isNaN(completedAt.getTime())) {
    throw new ApiError(400, "Invalid completedAt");
  }

  const onTime = completedAt <= occ.scheduledEndAt;
  const minutesLate = onTime
    ? 0
    : Math.ceil((completedAt - occ.scheduledEndAt) / 60000);

  occ.status = "completed";
  occ.completedAt = completedAt;
  occ.completedOnTime = onTime;
  await occ.save();

  await appendOccurrenceEvent({
    occurrenceId: occ._id,
    habitTaskId: occ.habitTaskId,
    userId: occ.userId,
    fromStatus: "pending",
    toStatus: "completed",
    reason: "user_completed",
    payload: {
      completedAt: completedAt.toISOString(),
      onTime,
      minutesLate,
    },
    actorType: "user",
    actorId: userId,
  });

  const rule = await HabitRecurrenceRule.findOne({
    habitTaskId: occ.habitTaskId,
    effectiveTo: null,
  }).sort({ version: -1 });

  if (rule && rule.kind === "completion_based") {
    await spawnNextCompletionBased(occ, completedAt, rule);
  } else if (rule) {
    await tryMaterializeNextAfterResolution(occ.habitTaskId, occ.userId);
  }

  return occ;
}
