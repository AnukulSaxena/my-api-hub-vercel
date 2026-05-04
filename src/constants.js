/** Production and non-development default MongoDB database name. */
const DEFAULT_DB_NAME = "myapihubDB";

/**
 * MongoDB database name appended to `MONGODB_URI`.
 * - `NODE_ENV === "development"`: `LOCAL_API_HUB_DB` (required).
 * - Otherwise (e.g. production): `myapihubDB`.
 * @returns {string}
 */
export function getDbName() {
  if (process.env.NODE_ENV === "development") {
    const fromEnv = process.env.LOCAL_API_HUB_DB?.trim();
    if (!fromEnv) {
      throw new Error(
        "LOCAL_API_HUB_DB must be set in .env when NODE_ENV is development (MongoDB database name for local)."
      );
    }
    return fromEnv;
  }
  return DEFAULT_DB_NAME;
}
