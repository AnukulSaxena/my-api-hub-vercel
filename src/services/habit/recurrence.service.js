import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import { HabitOccurrence } from "../../models/habit/habitOccurrence.model.js";
import { HabitTask } from "../../models/habit/habitTask.model.js";
import { RECURRENCE_KINDS } from "../../models/habit/habitRecurrenceRule.model.js";
import { HabitRecurrenceRule } from "../../models/habit/habitRecurrenceRule.model.js";

/** @param {Date} d */
export function startOfUtcDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/** @param {Date} d */
export function endOfUtcDay(d) {
  const x = new Date(d);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

/** @param {Date} d */
function startOfUtcWeekSunday(d) {
  const x = startOfUtcDay(d);
  const dow = x.getUTCDay();
  x.setUTCDate(x.getUTCDate() - dow);
  return x;
}

/** @param {Date} d */
export function utcTimePartsFromDate(d) {
  return {
    h: d.getUTCHours(),
    m: d.getUTCMinutes(),
    s: d.getUTCSeconds(),
    ms: d.getUTCMilliseconds(),
  };
}

/**
 * @param {Date} dayStart from startOfUtcDay
 * @param {{ h: number; m: number; s: number; ms: number }} parts
 */
export function combineUtcDayWithTime(dayStart, parts) {
  const x = new Date(dayStart);
  x.setUTCHours(parts.h, parts.m, parts.s, parts.ms);
  return x;
}

/**
 * @param {string | Date} startsOn
 */
export function assertStartsOnNotInPast(startsOn) {
  const d = startsOn instanceof Date ? startsOn : new Date(startsOn);
  if (Number.isNaN(d.getTime())) {
    throw new ApiError(400, "Invalid startsOn date");
  }
  const skewMs = 60_000;
  if (d.getTime() < Date.now() - skewMs) {
    throw new ApiError(400, "startsOn must not be in the past");
  }
}

/**
 * @param {Date} startsOn
 * @param {Date | null | undefined} endsOn
 */
export function assertEndsOnCoversStartsOnUtcDay(startsOn, endsOn) {
  if (!endsOn) return;
  const s = startOfUtcDay(startsOn);
  const e = startOfUtcDay(endsOn);
  if (s > e) {
    throw new ApiError(400, "endsOn must be on or after startsOn (UTC calendar day)");
  }
}

/** @param {import("../../models/habit/habitRecurrenceRule.model.js").HabitRecurrenceRule} rule */
function isRuleDayPastEndsOn(dayDate, rule) {
  if (!rule.endsOn) return false;
  return startOfUtcDay(dayDate) > startOfUtcDay(rule.endsOn);
}

/**
 * @param {string} kind
 * @param {Record<string, unknown>} payload
 */
export function validateRecurrencePayload(kind, payload) {
  if (!RECURRENCE_KINDS.includes(kind)) {
    throw new ApiError(400, `Invalid recurrence kind`);
  }
  const p = payload && typeof payload === "object" ? payload : {};

  switch (kind) {
    case "daily": {
      const interval = p.intervalDays ?? 1;
      if (typeof interval !== "number" || interval < 1 || !Number.isInteger(interval)) {
        throw new ApiError(400, "daily.payload.intervalDays must be a positive integer");
      }
      return { intervalDays: interval };
    }
    case "every_n_days": {
      const intervalDays = p.intervalDays;
      if (typeof intervalDays !== "number" || intervalDays < 1 || !Number.isInteger(intervalDays)) {
        throw new ApiError(400, "every_n_days.payload.intervalDays is required (positive integer)");
      }
      return { intervalDays };
    }
    case "weekly": {
      const byWeekday = p.byWeekday;
      if (!Array.isArray(byWeekday) || byWeekday.length === 0) {
        throw new ApiError(400, "weekly.payload.byWeekday must be a non-empty array of 0-6");
      }
      for (const d of byWeekday) {
        if (typeof d !== "number" || d < 0 || d > 6 || !Number.isInteger(d)) {
          throw new ApiError(400, "weekly.payload.byWeekday values must be integers 0-6 (Sun-Sat UTC)");
        }
      }
      const intervalWeeks = p.intervalWeeks ?? 1;
      if (typeof intervalWeeks !== "number" || intervalWeeks < 1 || !Number.isInteger(intervalWeeks)) {
        throw new ApiError(400, "weekly.payload.intervalWeeks must be a positive integer");
      }
      return { byWeekday, intervalWeeks };
    }
    case "monthly": {
      if (typeof p.dayOfMonth !== "number" || p.dayOfMonth < 1 || p.dayOfMonth > 31) {
        throw new ApiError(400, "monthly.payload.dayOfMonth must be 1-31 (materialization stub)");
      }
      return { dayOfMonth: p.dayOfMonth, intervalMonths: p.intervalMonths ?? 1 };
    }
    case "yearly": {
      if (typeof p.month !== "number" || p.month < 1 || p.month > 12) {
        throw new ApiError(400, "yearly.payload.month must be 1-12");
      }
      if (typeof p.day !== "number" || p.day < 1 || p.day > 31) {
        throw new ApiError(400, "yearly.payload.day must be 1-31");
      }
      return { month: p.month, day: p.day };
    }
    case "completion_based": {
      const anchor = p.anchor;
      if (anchor !== "last_completed_at" && anchor !== "last_scheduled_start_at") {
        throw new ApiError(
          400,
          "completion_based.payload.anchor must be last_completed_at or last_scheduled_start_at"
        );
      }
      const offset = p.offset;
      if (!offset || typeof offset !== "object") {
        throw new ApiError(400, "completion_based.payload.offset is required");
      }
      const unit = offset.unit;
      const value = offset.value;
      const allowed = ["hour", "day", "week"];
      if (!allowed.includes(unit)) {
        throw new ApiError(400, `completion_based.payload.offset.unit must be one of: ${allowed.join(", ")}`);
      }
      if (typeof value !== "number" || value < 1 || !Number.isInteger(value)) {
        throw new ApiError(400, "completion_based.payload.offset.value must be a positive integer");
      }
      return { anchor, offset: { unit, value } };
    }
    default:
      throw new ApiError(400, "Unsupported recurrence kind");
  }
}

/**
 * @param {import("mongoose").Types.ObjectId} habitTaskId
 */
export async function cancelFuturePendingOccurrences(habitTaskId) {
  const now = new Date();
  await HabitOccurrence.deleteMany({
    habitTaskId,
    status: "pending",
    scheduledStartAt: { $gte: now },
  });
}

/**
 * @param {import("mongoose").Types.ObjectId} habitTaskId
 * @param {Date} scheduledStartAt
 */
export async function hasPendingOccurrenceBefore(habitTaskId, scheduledStartAt) {
  const one = await HabitOccurrence.findOne({
    habitTaskId,
    status: "pending",
    scheduledStartAt: { $lt: scheduledStartAt },
  })
    .select("_id")
    .lean();
  return Boolean(one);
}

/**
 * After complete/skip/missed resolution, materialize at most one next calendar slot if horizon allows.
 * Skips completion_based (next slot is handled by spawnNextCompletionBased on complete only)
 * and once (single occurrence).
 *
 * @param {import("mongoose").Types.ObjectId} habitTaskId
 * @param {import("mongoose").Types.ObjectId | string} userId
 */
export async function tryMaterializeNextAfterResolution(habitTaskId, userId) {
  const task = await HabitTask.findById(habitTaskId);
  if (!task) return { inserted: 0, matched: 0 };

  const raw = task.metadata?.materializeHorizonDays;
  const horizon =
    typeof raw === "number" && Number.isFinite(raw) ? raw : Number(raw) || 0;
  if (horizon <= 0) return { inserted: 0, matched: 0 };

  const rule = await HabitRecurrenceRule.findOne({
    habitTaskId: task._id,
    effectiveTo: null,
  }).sort({ version: -1 });
  if (!rule || rule.kind === "completion_based" || rule.kind === "once") {
    return { inserted: 0, matched: 0 };
  }

  const now = new Date();
  const fromA = startOfUtcDay(now);
  const fromB = startOfUtcDay(rule.startsOn);
  const from = fromA > fromB ? fromA : fromB;
  const to = new Date(from.getTime() + horizon * 86400000);

  return materializeOccurrencesForWindow({
    habitTask: task,
    rule,
    userId,
    from,
    to,
  });
}

/**
 * Build occurrence slots for [from, to] inclusive (UTC day boundaries for iteration).
 * @param {object} params
 * @param {import("../../models/habit/habitTask.model.js").HabitTask} params.habitTask
 * @param {import("../../models/habit/habitRecurrenceRule.model.js").HabitRecurrenceRule} params.rule
 * @param {Date} params.from
 * @param {Date} params.to
 */
export function buildOccurrenceSlots({ habitTask, rule, from, to }) {
  const slots = [];
  const fromDay = startOfUtcDay(from);
  const toDay = startOfUtcDay(to);
  if (fromDay > toDay) return slots;

  const kind = rule.kind;
  const payload = rule.payload || {};
  const taskId = habitTask._id.toString();
  const startsOnDate = new Date(rule.startsOn);
  const timeParts = utcTimePartsFromDate(startsOnDate);

  if (kind === "once") {
    const dayD = startOfUtcDay(startsOnDate);
    if (isRuleDayPastEndsOn(dayD, rule)) {
      return slots;
    }
    if (dayD < fromDay || dayD > toDay) {
      return slots;
    }
    slots.push({
      occurrenceKey: `${taskId}:once`,
      scheduledStartAt: combineUtcDayWithTime(dayD, timeParts),
      scheduledEndAt: endOfUtcDay(dayD),
    });
    return slots;
  }

  if (kind === "daily") {
    const intervalDays = payload.intervalDays ?? 1;
    for (let d = new Date(fromDay); d <= toDay; ) {
      if (isRuleDayPastEndsOn(d, rule)) break;
      const key = `${taskId}:daily:${d.toISOString().slice(0, 10)}`;
      const dayStart = startOfUtcDay(d);
      slots.push({
        occurrenceKey: key,
        scheduledStartAt: combineUtcDayWithTime(dayStart, timeParts),
        scheduledEndAt: endOfUtcDay(d),
      });
      d.setUTCDate(d.getUTCDate() + intervalDays);
    }
    return slots;
  }

  if (kind === "every_n_days") {
    const intervalDays = payload.intervalDays;
    const anchor = startOfUtcDay(rule.startsOn);
    const msDay = 86400000;
    for (let d = new Date(fromDay); d <= toDay; d.setUTCDate(d.getUTCDate() + 1)) {
      if (isRuleDayPastEndsOn(d, rule)) break;
      const diff = Math.floor((startOfUtcDay(d) - anchor) / msDay);
      if (diff < 0) continue;
      if (diff % intervalDays !== 0) continue;
      const key = `${taskId}:n${intervalDays}:${d.toISOString().slice(0, 10)}`;
      const dayStart = startOfUtcDay(d);
      slots.push({
        occurrenceKey: key,
        scheduledStartAt: combineUtcDayWithTime(dayStart, timeParts),
        scheduledEndAt: endOfUtcDay(d),
      });
    }
    return slots;
  }

  if (kind === "weekly") {
    const byWeekday = new Set(payload.byWeekday);
    const intervalWeeks = payload.intervalWeeks ?? 1;
    const anchorWeek = startOfUtcWeekSunday(rule.startsOn);

    for (let d = new Date(fromDay); d <= toDay; d.setUTCDate(d.getUTCDate() + 1)) {
      if (isRuleDayPastEndsOn(d, rule)) break;
      if (!byWeekday.has(d.getUTCDay())) continue;
      const weekStart = startOfUtcWeekSunday(d);
      const weeksDiff = Math.floor((weekStart - anchorWeek) / (7 * 86400000));
      if (weeksDiff < 0) continue;
      if (weeksDiff % intervalWeeks !== 0) continue;
      const key = `${taskId}:w:${d.toISOString().slice(0, 10)}`;
      const dayStart = startOfUtcDay(d);
      slots.push({
        occurrenceKey: key,
        scheduledStartAt: combineUtcDayWithTime(dayStart, timeParts),
        scheduledEndAt: endOfUtcDay(d),
      });
    }
    return slots;
  }

  if (kind === "monthly" || kind === "yearly" || kind === "completion_based") {
    return slots;
  }

  return slots;
}

/**
 * @param {object} params
 * @param {import("../../models/habit/habitTask.model.js").HabitTask} params.habitTask
 * @param {import("../../models/habit/habitRecurrenceRule.model.js").HabitRecurrenceRule} params.rule
 * @param {import("mongoose").Types.ObjectId} params.userId
 * @param {Date} params.from
 * @param {Date} params.to
 */
export async function materializeOccurrencesForWindow({
  habitTask,
  rule,
  userId,
  from,
  to,
}) {
  const userObjectId =
    userId instanceof mongoose.Types.ObjectId
      ? userId
      : new mongoose.Types.ObjectId(String(userId));

  const slots = buildOccurrenceSlots({ habitTask, rule, from, to });
  if (slots.length === 0) {
    return { inserted: 0, matched: 0 };
  }

  slots.sort((a, b) => a.scheduledStartAt - b.scheduledStartAt);

  for (const s of slots) {
    const existing = await HabitOccurrence.findOne({
      habitTaskId: habitTask._id,
      occurrenceKey: s.occurrenceKey,
    })
      .select("_id")
      .lean();
    if (existing) continue;

    if (await hasPendingOccurrenceBefore(habitTask._id, s.scheduledStartAt)) {
      return { inserted: 0, matched: 0 };
    }

    const res = await HabitOccurrence.bulkWrite(
      [
        {
          updateOne: {
            filter: {
              habitTaskId: habitTask._id,
              occurrenceKey: s.occurrenceKey,
            },
            update: {
              $setOnInsert: {
                habitTaskId: habitTask._id,
                userId: userObjectId,
                recurrenceRuleId: rule._id,
                recurrenceRuleVersion: rule.version,
                scheduledStartAt: s.scheduledStartAt,
                scheduledEndAt: s.scheduledEndAt,
                occurrenceKey: s.occurrenceKey,
                status: "pending",
                completedAt: null,
                completedOnTime: null,
                skippedAt: null,
                missedAt: null,
              },
            },
            upsert: true,
          },
        },
      ],
      { ordered: true }
    );
    return {
      inserted: res.upsertedCount ?? 0,
      matched: res.matchedCount ?? 0,
    };
  }

  return { inserted: 0, matched: 0 };
}

/**
 * @param {Date} anchor
 * @param {{ unit: string; value: number }} offset
 */
export function addOffset(anchor, offset) {
  const d = new Date(anchor);
  const v = offset.value;
  switch (offset.unit) {
    case "hour":
      d.setUTCHours(d.getUTCHours() + v);
      return d;
    case "day":
      d.setUTCDate(d.getUTCDate() + v);
      return d;
    case "week":
      d.setUTCDate(d.getUTCDate() + v * 7);
      return d;
    default:
      return d;
  }
}
