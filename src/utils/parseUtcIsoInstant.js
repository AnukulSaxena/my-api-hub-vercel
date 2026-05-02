import { ApiError } from "./ApiError.js";

/**
 * @param {string} s
 * @returns {boolean}
 */
function stringHasExplicitTimeZoneDesignator(s) {
  const t = s.trim();
  if (/Z$/i.test(t)) return true;
  if (/[+-]\d{2}:\d{2}$/.test(t)) return true;
  if (/[+-]\d{4}$/.test(t)) return true;
  return false;
}

/**
 * Parse client-supplied instants so they are never interpreted in the host's local time zone.
 * Require ISO-8601 with `Z` or a numeric offset.
 *
 * @param {string|Date} value
 * @param {string} fieldName
 * @returns {Date}
 */
export function parseUtcIsoInstant(value, fieldName) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new ApiError(400, `${fieldName} is invalid`);
    }
    return value;
  }
  if (value == null || value === "") {
    throw new ApiError(400, `${fieldName} is required`);
  }
  const s = String(value).trim();
  if (!stringHasExplicitTimeZoneDesignator(s)) {
    throw new ApiError(
      400,
      `${fieldName} must be ISO-8601 with UTC (Z) or a numeric offset (+00:00), not a local-time-only value`
    );
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    throw new ApiError(400, `${fieldName} is invalid`);
  }
  return d;
}

/**
 * @param {string|Date|null|undefined} value
 * @param {string} fieldName
 * @returns {Date|null}
 */
export function parseUtcIsoInstantOptional(value, fieldName) {
  if (value == null || value === "") return null;
  return parseUtcIsoInstant(value, fieldName);
}
