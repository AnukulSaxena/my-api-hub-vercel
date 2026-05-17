import { ApiError } from "../../utils/ApiError.js";
import { User } from "../../models/user.model.js";
import { RECURRENCE_KINDS } from "../../models/habit/habitRecurrenceRule.model.js";

/** @typedef {"priority" | "scheduledStartAt" | "title" | "recurrenceKind"} DashboardSortField */
/** @typedef {"asc" | "desc"} DashboardSortDirection */

export const DEFAULT_DASHBOARD_SORT_CONFIG = {
  version: 1,
  primary: { field: "priority", direction: "desc" },
  secondary: { field: "scheduledStartAt", direction: "asc" },
  recurrenceKindOrder: [
    "once",
    "daily",
    "every_n_days",
    "weekly",
    "monthly",
    "yearly",
    "completion_based",
  ],
};

const SORT_FIELDS = ["priority", "scheduledStartAt", "title", "recurrenceKind"];
const SORT_DIRECTIONS = ["asc", "desc"];

/**
 * @param {unknown} raw
 * @returns {typeof DEFAULT_DASHBOARD_SORT_CONFIG}
 */
export function validateDashboardSortConfig(raw) {
  if (!raw || typeof raw !== "object") {
    throw new ApiError(400, "dashboardSort must be an object");
  }
  const o = /** @type {Record<string, unknown>} */ (raw);
  if (o.version !== 1) {
    throw new ApiError(400, "dashboardSort.version must be 1");
  }

  const primary = validateSortKey(o.primary, "primary");
  const secondary = validateSortKey(o.secondary, "secondary");

  const orderRaw = o.recurrenceKindOrder;
  if (!Array.isArray(orderRaw)) {
    throw new ApiError(400, "recurrenceKindOrder must be an array");
  }
  if (orderRaw.length !== RECURRENCE_KINDS.length) {
    throw new ApiError(
      400,
      `recurrenceKindOrder must contain exactly ${RECURRENCE_KINDS.length} kinds`
    );
  }
  const seen = new Set();
  for (const k of orderRaw) {
    if (typeof k !== "string" || !RECURRENCE_KINDS.includes(k)) {
      throw new ApiError(400, "recurrenceKindOrder contains invalid kind");
    }
    if (seen.has(k)) {
      throw new ApiError(400, "recurrenceKindOrder must not duplicate kinds");
    }
    seen.add(k);
  }

  return {
    version: 1,
    primary,
    secondary,
    recurrenceKindOrder: [...orderRaw],
  };
}

/**
 * @param {unknown} key
 * @param {string} label
 */
function validateSortKey(key, label) {
  if (!key || typeof key !== "object") {
    throw new ApiError(400, `${label} must be an object`);
  }
  const k = /** @type {Record<string, unknown>} */ (key);
  const field = k.field;
  const direction = k.direction;
  if (typeof field !== "string" || !SORT_FIELDS.includes(field)) {
    throw new ApiError(
      400,
      `${label}.field must be one of: ${SORT_FIELDS.join(", ")}`
    );
  }
  if (typeof direction !== "string" || !SORT_DIRECTIONS.includes(direction)) {
    throw new ApiError(
      400,
      `${label}.direction must be asc or desc`
    );
  }
  return { field, direction };
}

/**
 * @param {import("mongoose").Types.ObjectId | string} userId
 */
export async function getDashboardSortForUser(userId) {
  const user = await User.findById(userId).select("preferences.dashboardSort").lean();
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const saved = user.preferences?.dashboardSort;
  if (!saved) {
    return { ...DEFAULT_DASHBOARD_SORT_CONFIG, recurrenceKindOrder: [...RECURRENCE_KINDS] };
  }
  try {
    return validateDashboardSortConfig(saved);
  } catch {
    return { ...DEFAULT_DASHBOARD_SORT_CONFIG, recurrenceKindOrder: [...RECURRENCE_KINDS] };
  }
}

/**
 * @param {import("mongoose").Types.ObjectId | string} userId
 * @param {unknown} raw
 */
export async function setDashboardSortForUser(userId, raw) {
  const config = validateDashboardSortConfig(raw);
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { "preferences.dashboardSort": config } },
    { new: true }
  ).select("preferences.dashboardSort");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return config;
}
