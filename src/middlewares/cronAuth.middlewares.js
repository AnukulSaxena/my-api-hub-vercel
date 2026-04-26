import { ApiError } from "../utils/ApiError.js";

/**
 * Requires `Authorization: Bearer <CRON_SECRET>` matching `process.env.CRON_SECRET`.
 * Use for internal cron HTTP routes only.
 */
export function requireCronSecret(req, _res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !String(secret).trim()) {
    return next(
      new ApiError(503, "CRON_SECRET is not configured; cron routes are disabled")
    );
  }

  const auth = req.headers.authorization;
  const token =
    typeof auth === "string" && auth.startsWith("Bearer ")
      ? auth.slice(7).trim()
      : "";

  if (!token || token !== secret) {
    return next(new ApiError(401, "Unauthorized"));
  }

  next();
}
