/**
 * Integration check for missed occurrence sweep (requires MongoDB via .env).
 * Run from repo root: node scripts/verify-missed-sweep.mjs
 */
import "./bootstrap-dotenv.mjs";

import mongoose from "mongoose";
import { getDbName } from "../src/constants.js";
import { User } from "../src/models/user.model.js";
import { HabitTask } from "../src/models/habit/habitTask.model.js";
import { HabitRecurrenceRule } from "../src/models/habit/habitRecurrenceRule.model.js";
import { HabitOccurrence } from "../src/models/habit/habitOccurrence.model.js";
import { HabitOccurrenceEvent } from "../src/models/habit/habitOccurrenceEvent.model.js";
import { markOverduePendingAsMissed } from "../src/services/habit/missedOccurrenceSweep.service.js";
import { transitionOccurrence } from "../src/services/habit/occurrenceLifecycle.service.js";

function assert(cond, msg) {
  if (!cond) {
    console.error("Assertion failed:", msg);
    process.exit(1);
  }
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI missing; set in .env to run this script.");
    process.exit(1);
  }

  await mongoose.connect(`${process.env.MONGODB_URI}/${getDbName()}`);

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const user = await User.create({
    email: `sweep-verify-${suffix}@test.local`,
    password: "sweep-verify-password-32chars-min",
  });

  const task = await HabitTask.create({
    userId: user._id,
    title: "Sweep verify task",
  });

  const rule = await HabitRecurrenceRule.create({
    habitTaskId: task._id,
    userId: user._id,
    version: 1,
    kind: "daily",
    startsOn: new Date(),
    effectiveTo: null,
  });

  const pastEnd = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const pastStart = new Date(pastEnd.getTime() - 60 * 60 * 1000);
  const key1 = `sweep:${suffix}:1`;

  const occ1 = await HabitOccurrence.create({
    habitTaskId: task._id,
    userId: user._id,
    recurrenceRuleId: rule._id,
    recurrenceRuleVersion: 1,
    scheduledStartAt: pastStart,
    scheduledEndAt: pastEnd,
    occurrenceKey: key1,
    status: "pending",
  });

  const r1 = await markOverduePendingAsMissed({ limit: 5000 });
  assert(r1.scanned >= 1 && r1.markedMissed >= 1, "expected sweep to mark occ1 missed");

  const after1 = await HabitOccurrence.findById(occ1._id).lean();
  assert(after1?.status === "missed" && after1.missedAt, "occ1 should be missed");

  const ev1 = await HabitOccurrenceEvent.findOne({
    occurrenceId: occ1._id,
    reason: "deadline_passed",
  }).lean();
  assert(ev1 && ev1.actorType === "system", "deadline_passed system event expected");

  const pastEnd2 = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const pastStart2 = new Date(pastEnd2.getTime() - 60 * 60 * 1000);
  const key2 = `sweep:${suffix}:2`;

  const occ2 = await HabitOccurrence.create({
    habitTaskId: task._id,
    userId: user._id,
    recurrenceRuleId: rule._id,
    recurrenceRuleVersion: 1,
    scheduledStartAt: pastStart2,
    scheduledEndAt: pastEnd2,
    occurrenceKey: key2,
    status: "pending",
  });

  await transitionOccurrence(user._id.toString(), occ2._id.toString(), {
    action: "complete",
  });

  await markOverduePendingAsMissed({ limit: 5000 });

  const after2 = await HabitOccurrence.findById(occ2._id).lean();
  assert(after2?.status === "completed", "occ2 should stay completed");

  await HabitOccurrenceEvent.deleteMany({
    occurrenceId: { $in: [occ1._id, occ2._id] },
  });
  await HabitOccurrence.deleteMany({ _id: { $in: [occ1._id, occ2._id] } });
  await HabitRecurrenceRule.deleteOne({ _id: rule._id });
  await HabitTask.deleteOne({ _id: task._id });
  await User.deleteOne({ _id: user._id });

  await mongoose.disconnect();
  console.log("verify-missed-sweep: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
