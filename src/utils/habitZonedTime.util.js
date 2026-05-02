import { DateTime, Info } from "luxon";
import { ApiError } from "./ApiError.js";

/**
 * @param {unknown} raw
 * @returns {string} IANA zone id
 */
export function normalizeTaskTimeZone(raw) {
  const z = typeof raw === "string" && raw.trim() ? raw.trim() : "UTC";
  if (!Info.isValidIANAZone(z)) {
    throw new ApiError(400, `Invalid IANA timezone: ${z}`);
  }
  return z;
}

/**
 * Start of the IANA calendar day containing `utcDate`, as a UTC {@link Date} instant.
 * @param {Date} utcDate
 * @param {string} zone
 */
export function zonedStartOfDayContaining(utcDate, zone) {
  return DateTime.fromJSDate(utcDate, { zone: "utc" })
    .setZone(zone)
    .startOf("day")
    .toUTC()
    .toJSDate();
}

/**
 * Wall clock on `ruleStartsOnUtc` interpreted in `zone` (for repeating the same local time each day).
 * @param {Date} ruleStartsOnUtc
 * @param {string} zone
 */
export function wallTimeFromUtcInstantInZone(ruleStartsOnUtc, zone) {
  const z = DateTime.fromJSDate(ruleStartsOnUtc, { zone: "utc" }).setZone(zone);
  return {
    hour: z.hour,
    minute: z.minute,
    second: z.second,
    millisecond: z.millisecond,
  };
}

/**
 * @param {import("luxon").DateTime} zonedDayStart — start of calendar day in `zone`
 * @param {{ hour: number; minute: number; second: number; millisecond: number }} wall
 * @param {string} zone
 */
export function slotFromZonedDayWall(zonedDayStart, wall, zone) {
  const z = zonedDayStart.setZone(zone).startOf("day");
  const start = z
    .set({
      hour: wall.hour,
      minute: wall.minute,
      second: wall.second,
      millisecond: wall.millisecond,
    })
    .toUTC()
    .toJSDate();
  const end = z.endOf("day").toUTC().toJSDate();
  return { scheduledStartAt: start, scheduledEndAt: end };
}

/**
 * Week starts Sunday (matches JS `getDay`: 0 = Sun … 6 = Sat).
 * @param {import("luxon").DateTime} zonedDayStart
 */
export function startOfZonedWeekSunday(zonedDayStart) {
  const z = zonedDayStart.startOf("day");
  const offsetFromSun = z.weekday === 7 ? 0 : z.weekday;
  return z.minus({ days: offsetFromSun }).startOf("day");
}

/**
 * @param {Date} startsOn
 * @param {Date | null | undefined} endsOn
 * @param {string} zone
 */
export function assertEndsOnCoversStartsOnInZone(startsOn, endsOn, zone) {
  if (!endsOn) return;
  const s = DateTime.fromJSDate(startsOn, { zone: "utc" }).setZone(zone).toISODate();
  const e = DateTime.fromJSDate(endsOn, { zone: "utc" }).setZone(zone).toISODate();
  if (!s || !e || s > e) {
    throw new ApiError(
      400,
      "endsOn must be on or after startsOn (calendar days in the habit timezone)"
    );
  }
}

/**
 * End of the IANA calendar day containing `utcDate`, as a UTC {@link Date} instant.
 * @param {Date} utcDate
 * @param {string} zone
 */
export function zonedEndOfDayContaining(utcDate, zone) {
  return DateTime.fromJSDate(utcDate, { zone: "utc" })
    .setZone(zone)
    .endOf("day")
    .toUTC()
    .toJSDate();
}
