import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { HabitOccurrence } from "../../models/habit/habitOccurrence.model.js";
import { HabitOccurrenceEvent } from "../../models/habit/habitOccurrenceEvent.model.js";
import { transitionOccurrence } from "../../services/habit/occurrenceLifecycle.service.js";

const getOccurrence = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { occurrenceId } = req.params;
  const occ = await HabitOccurrence.findOne({
    _id: occurrenceId,
    userId,
  }).lean();
  if (!occ) {
    throw new ApiError(404, "Occurrence not found");
  }
  const recentEvents = await HabitOccurrenceEvent.find({ occurrenceId: occ._id })
    .sort({ at: -1 })
    .limit(20)
    .lean();
  return res
    .status(200)
    .json(new ApiResponse(200, { occurrence: occ, recentEvents }, "OK"));
});

const listOccurrenceEvents = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { occurrenceId } = req.params;
  const occ = await HabitOccurrence.findOne({
    _id: occurrenceId,
    userId,
  }).select("_id");
  if (!occ) {
    throw new ApiError(404, "Occurrence not found");
  }
  const events = await HabitOccurrenceEvent.find({
    occurrenceId: new mongoose.Types.ObjectId(occurrenceId),
  })
    .sort({ at: 1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, { events }, "OK"));
});

const transition = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { occurrenceId } = req.params;
  const updated = await transitionOccurrence(userId, occurrenceId, req.body);
  return res
    .status(200)
    .json(new ApiResponse(200, { occurrence: updated }, "Transition applied"));
});

export { getOccurrence, listOccurrenceEvents, transition };
