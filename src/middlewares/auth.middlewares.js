import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { ACCESS_TOKEN_COOKIE } from "../utils/authCookies.util.js";

/**
 * Verifies access JWT from the httpOnly `access_token` cookie and sets `req.user`.
 * @type {import("express").RequestHandler}
 */
export function authenticate(req, res, next) {
  try {
    const token = req.cookies?.[ACCESS_TOKEN_COOKIE];
    if (!token || typeof token !== "string") {
      throw new ApiError(401, "Access token required");
    }
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: Array.isArray(payload.roles) ? payload.roles : ["user"],
    };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * RBAC: must run after {@link authenticate}.
 * @param {...string} allowedRoles
 * @returns {import("express").RequestHandler}
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "Not authenticated");
      }
      const userRoles = req.user.roles || [];
      const allowed = new Set(allowedRoles);
      if (!userRoles.some((r) => allowed.has(r))) {
        throw new ApiError(403, "Insufficient permissions");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
