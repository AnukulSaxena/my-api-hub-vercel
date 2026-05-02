import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { HabitTask } from "../../models/habit/habitTask.model.js";
import { HabitRecurrenceRule } from "../../models/habit/habitRecurrenceRule.model.js";
import { HabitOccurrence } from "../../models/habit/habitOccurrence.model.js";
import {
  validateRecurrencePayload,
  cancelFuturePendingOccurrences,
  materializeOccurrencesForWindow,
  assertStartsOnNotInPast,
} from "../../services/habit/recurrence.service.js";
import {
  normalizeTaskTimeZone,
  zonedStartOfDayContaining,
  assertEndsOnCoversStartsOnInZone,
} from "../../utils/habitZonedTime.util.js";
import {
  parseUtcIsoInstant,
  parseUtcIsoInstantOptional,
} from "../../utils/parseUtcIsoInstant.js";

async function getOwnedTaskOrThrow(userId, habitTaskId) {
  const task = await HabitTask.findOne({
    _id: habitTaskId,
    userId,
  });
  if (!task) {
    throw new ApiError(404, "Habit task not found");
  }
  return task;
}

const createHabit = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    title,
    description,
    priority,
    tags,
    timezone,
    definitionStatus,
    metadata,
    recurrence,
    immediateMaterializeDays,
  } = req.body;

  const validatedPayload = validateRecurrencePayload(
    recurrence.kind,
    recurrence.payload
  );

  const startsOnDate = parseUtcIsoInstant(
    recurrence.startsOn,
    "recurrence.startsOn"
  );
  assertStartsOnNotInPast(startsOnDate);
  const endsOnDate = parseUtcIsoInstantOptional(
    recurrence.endsOn,
    "recurrence.endsOn"
  );
  const taskTimeZone = normalizeTaskTimeZone(timezone);
  assertEndsOnCoversStartsOnInZone(startsOnDate, endsOnDate, taskTimeZone);

  const horizon = Math.min(
    90,
    Math.max(0, Math.floor(Number(immediateMaterializeDays ?? 0)))
  );
  const metaIn = metadata && typeof metadata === "object" ? metadata : {};
  const taskMetadata = { ...metaIn, materializeHorizonDays: horizon };

  let task = null;
  try {
    task = await HabitTask.create({
      userId,
      title,
      description: description ?? "",
      priority: priority ?? 0,
      tags: Array.isArray(tags) ? tags : [],
      timezone: taskTimeZone,
      definitionStatus: definitionStatus ?? "active",
      metadata: taskMetadata,
    });

    await HabitRecurrenceRule.create({
      habitTaskId: task._id,
      userId,
      version: 1,
      effectiveTo: null,
      kind: recurrence.kind,
      payload: validatedPayload,
      startsOn: startsOnDate,
      endsOn: endsOnDate,
    });
  } catch (err) {
    if (task?._id) {
      await HabitTask.deleteOne({ _id: task._id });
    }
    throw err;
  }

  const rule = await HabitRecurrenceRule.findOne({
    habitTaskId: task._id,
    effectiveTo: null,
  });

  let materializeSummary = null;
  if (rule) {
    const now = new Date();
    const tz = normalizeTaskTimeZone(task.timezone);
    const fromA = zonedStartOfDayContaining(now, tz);
    const fromB = zonedStartOfDayContaining(new Date(rule.startsOn), tz);
    const from = fromA > fromB ? fromA : fromB;
    const horizonForSearch = Math.max(horizon, 1);
    const to = new Date(from.getTime() + horizonForSearch * 86400000);
    materializeSummary = await materializeOccurrencesForWindow({
      habitTask: task,
      rule,
      userId,
      from,
      to,
    });
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      { task, materializeSummary },
      "Habit task created successfully"
    )
  );
});

const listHabits = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { definitionStatus, tag, page = 1, limit = 20 } = req.query;
  const filter = { userId };
  if (definitionStatus) {
    filter.definitionStatus = definitionStatus;
  }
  if (tag) {
    filter.tags = tag;
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    HabitTask.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    HabitTask.countDocuments(filter),
  ]);
  return res.status(200).json(
    new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }, "OK")
  );
});

const getHabit = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { habitTaskId } = req.params;
  const task = await getOwnedTaskOrThrow(userId, habitTaskId);
  const currentRule = await HabitRecurrenceRule.findOne({
    habitTaskId: task._id,
    effectiveTo: null,
  }).lean();
  return res
    .status(200)
    .json(new ApiResponse(200, { task, currentRule }, "OK"));
});

const patchHabit = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { habitTaskId } = req.params;
  const task = await getOwnedTaskOrThrow(userId, habitTaskId);
  const allowed = [
    "title",
    "description",
    "priority",
    "tags",
    "timezone",
    "definitionStatus",
    "metadata",
  ];
  for (const key of allowed) {
    if (key in req.body) {
      task[key] = req.body[key];
    }
  }
  await task.save();
  return res.status(200).json(new ApiResponse(200, { task }, "Updated"));
});

const addRecurrence = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { habitTaskId } = req.params;
  const task = await getOwnedTaskOrThrow(userId, habitTaskId);
  const { kind, payload, startsOn, endsOn } = req.body;

  const validatedPayload = validateRecurrencePayload(kind, payload);

  const startsOnDate = parseUtcIsoInstant(startsOn, "startsOn");
  assertStartsOnNotInPast(startsOnDate);
  const endsOnDate = parseUtcIsoInstantOptional(endsOn, "endsOn");
  assertEndsOnCoversStartsOnInZone(
    startsOnDate,
    endsOnDate,
    normalizeTaskTimeZone(task.timezone)
  );

  await cancelFuturePendingOccurrences(task._id);
  await HabitRecurrenceRule.updateMany(
    { habitTaskId: task._id, effectiveTo: null },
    { $set: { effectiveTo: new Date() } }
  );

  const last = await HabitRecurrenceRule.findOne({ habitTaskId: task._id })
    .sort({ version: -1 })
    .select("version")
    .lean();
  const nextVersion = last ? last.version + 1 : 1;

  const rule = await HabitRecurrenceRule.create({
    habitTaskId: task._id,
    userId,
    version: nextVersion,
    effectiveTo: null,
    kind,
    payload: validatedPayload,
    startsOn: startsOnDate,
    endsOn: endsOnDate,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { rule, cancelledFuturePending: true },
        "Recurrence rule version created"
      )
    );
});

const materializeOccurrences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { habitTaskId } = req.params;
  const { from, to } = req.body;
  const task = await getOwnedTaskOrThrow(userId, habitTaskId);
  const fromDate = parseUtcIsoInstant(from, "from");
  const toDate = parseUtcIsoInstant(to, "to");
  if (fromDate > toDate) {
    throw new ApiError(400, "from must be before or equal to to");
  }
  const rule = await HabitRecurrenceRule.findOne({
    habitTaskId: task._id,
    effectiveTo: null,
  });
  if (!rule) {
    throw new ApiError(400, "No active recurrence rule for this task");
  }
  const summary = await materializeOccurrencesForWindow({
    habitTask: task,
    rule,
    userId,
    from: fromDate,
    to: toDate,
  });
  return res.status(200).json(new ApiResponse(200, summary, "Materialized"));
});

const listOccurrences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { habitTaskId } = req.params;
  await getOwnedTaskOrThrow(userId, habitTaskId);
  const { from, to, status } = req.query;
  const fromStr = from != null ? String(from).trim() : "";
  const toStr = to != null ? String(to).trim() : "";
  const hasFrom = Boolean(fromStr);
  const hasTo = Boolean(toStr);
  if (hasFrom !== hasTo) {
    throw new ApiError(
      400,
      "Provide both from and to (ISO8601), or omit both to list all occurrences for this habit."
    );
  }
  const filter = {
    habitTaskId: new mongoose.Types.ObjectId(habitTaskId),
    userId: new mongoose.Types.ObjectId(userId),
  };
  if (hasFrom && hasTo) {
    const fromDate = parseUtcIsoInstant(fromStr, "from");
    const toDate = parseUtcIsoInstant(toStr, "to");
    if (fromDate > toDate) {
      throw new ApiError(400, "from must be before or equal to to");
    }
    filter.scheduledStartAt = { $gte: fromDate, $lte: toDate };
  }
  if (status) {
    filter.status = status;
  }
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(String(req.query.limit ?? "20"), 10) || 20),
  );
  const skip = (page - 1) * limit;
  const [total, items] = await Promise.all([
    HabitOccurrence.countDocuments(filter),
    HabitOccurrence.find(filter)
      .sort({ scheduledStartAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, { items, page, limit, total }, "OK"));
});

const AGENDA_LIMIT = 50;

/**
 * All pending (or selected status) occurrences for the user in a time window, joined with task
 * for display. Sorted by task priority (desc) then scheduledStartAt (asc).
 */
const listUserAgenda = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { from, to, status = "pending" } = req.query;
  const fromDate = parseUtcIsoInstant(from, "from");
  const toDate = parseUtcIsoInstant(to, "to");
  if (fromDate > toDate) {
    throw new ApiError(400, "from must be before or equal to to");
  }
  const userOid = new mongoose.Types.ObjectId(userId);
  const occs = await HabitOccurrence.find({
    userId: userOid,
    status,
    scheduledStartAt: { $gte: fromDate, $lte: toDate },
  })
    .populate({
      path: "habitTaskId",
      select: "title priority tags definitionStatus",
    })
    .limit(200)
    .lean();

  const rows = occs
    .filter(
      (o) =>
        o.habitTaskId &&
        typeof o.habitTaskId === "object" &&
        o.habitTaskId.definitionStatus !== "archived"
    )
    .map((o) => {
      const t = o.habitTaskId;
      const pr = typeof t.priority === "number" ? t.priority : 0;
      return {
        pr,
        occurrence: { ...o, habitTaskId: t._id },
        task: {
          _id: t._id,
          title: t.title,
          priority: pr,
          tags: Array.isArray(t.tags) ? t.tags : [],
        },
      };
    });
  rows.sort((a, b) => {
    if (b.pr !== a.pr) {
      return b.pr - a.pr;
    }
    return new Date(a.occurrence.scheduledStartAt) - new Date(b.occurrence.scheduledStartAt);
  });
  const items = rows.slice(0, AGENDA_LIMIT).map((r) => ({
    occurrence: r.occurrence,
    task: r.task,
  }));
  return res.status(200).json(new ApiResponse(200, { items }, "OK"));
});

const deleteHabit = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { habitTaskId } = req.params;
  const task = await getOwnedTaskOrThrow(userId, habitTaskId);

  await Promise.all([
    HabitRecurrenceRule.deleteMany({ habitTaskId: task._id }),
    HabitOccurrence.deleteMany({ habitTaskId: task._id }),
    HabitTask.deleteOne({ _id: task._id }),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Habit deleted successfully"));
});

export {
  createHabit,
  listHabits,
  getHabit,
  patchHabit,
  deleteHabit,
  addRecurrence,
  materializeOccurrences,
  listOccurrences,
  listUserAgenda,
};
