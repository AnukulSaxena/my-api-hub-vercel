import jwt from "jsonwebtoken";
import { getAccessTokenOptions, getRefreshTokenOptions } from "../config/jwt.config.js";
import { ApiError } from "./ApiError.js";

/** @param {{ _id: unknown; email: string; roles?: string[] }} user */
export function signAccessToken(user) {
  const { secret, expiresIn } = getAccessTokenOptions();
  const id = user._id.toString();
  const roles = Array.isArray(user.roles) ? user.roles : ["user"];
  return jwt.sign(
    {
      sub: id,
      email: user.email,
      roles,
      type: "access",
    },
    secret,
    { expiresIn }
  );
}

/** @param {{ _id: unknown }} user */
export function signRefreshToken(user) {
  const { secret, expiresIn } = getRefreshTokenOptions();
  const id = user._id.toString();
  return jwt.sign(
    {
      sub: id,
      type: "refresh",
    },
    secret,
    { expiresIn }
  );
}

/**
 * @param {string} token
 * @returns {import("jsonwebtoken").JwtPayload & { sub: string; email?: string; roles?: string[]; type?: string }}
 */
export function verifyAccessToken(token) {
  try {
    const { secret } = getAccessTokenOptions();
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string" || decoded.type !== "access" || !decoded.sub) {
      throw new ApiError(401, "Invalid access token");
    }
    return decoded;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, "Invalid or expired access token");
  }
}

/**
 * @param {string} token
 * @returns {import("jsonwebtoken").JwtPayload & { sub: string; type?: string }}
 */
export function verifyRefreshToken(token) {
  try {
    const { secret } = getRefreshTokenOptions();
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string" || decoded.type !== "refresh" || !decoded.sub) {
      throw new ApiError(401, "Invalid refresh token");
    }
    return decoded;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, "Invalid or expired refresh token");
  }
}
