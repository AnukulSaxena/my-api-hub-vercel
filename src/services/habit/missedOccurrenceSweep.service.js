import mongoose from "mongoose";
import { HabitOccurrence } from "../../models/habit/habitOccurrence.model.js";
import { appendOccurrenceEvent } from "./occurrenceLifecycle.service.js";
import { tryMaterializeNextAfterResolution } from "./recurrence.service.js";

const DEFAULT_LIMIT = 500;

/**
 * Marks overdue pending occurrences as missed (atomic per row) and appends audit events.
 *
 * @param {{ now?: Date; limit?: number }} [opts]
 * @returns {Promise<{ scanned: number; markedMissed: number }>}
 */
export async function markOverduePendingAsMissed(opts = {}) {
  const now = opts.now ?? new Date();
  const limit = opts.limit ?? DEFAULT_LIMIT;

  const candidates = await HabitOccurrence.find({
    status: "pending",
    scheduledEndAt: { $ne: null, $lt: now },
  })
    .sort({ scheduledEndAt: 1 })
    .limit(limit)
    .select("_id")
    .lean();

  let markedMissed = 0;
  /** @type {Map<string, import("mongoose").Types.ObjectId>} */
  const taskIdToUserId = new Map();

  for (const row of candidates) {
    const updated = await HabitOccurrence.findOneAndUpdate(
      {
        _id: row._id,
        status: "pending",
        scheduledEndAt: { $ne: null, $lt: now },
      },
      { $set: { status: "missed", missedAt: now } },
      { new: true }
    );

    if (!updated) continue;

    markedMissed += 1;
    taskIdToUserId.set(String(updated.habitTaskId), updated.userId);
    await appendOccurrenceEvent({
      occurrenceId: updated._id,
      habitTaskId: updated.habitTaskId,
      userId: updated.userId,
      fromStatus: "pending",
      toStatus: "missed",
      reason: "deadline_passed",
      payload: { asOf: now.toISOString() },
      actorType: "system",
      actorId: null,
    });
  }

  for (const [tid, uid] of taskIdToUserId) {
    await tryMaterializeNextAfterResolution(new mongoose.Types.ObjectId(tid), uid);
  }

  return { scanned: candidates.length, markedMissed };
}
