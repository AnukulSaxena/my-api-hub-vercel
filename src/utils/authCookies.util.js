import { getAccessTokenOptions, getRefreshTokenOptions } from "../config/jwt.config.js";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

/**
 * @param {string | undefined} expiresIn e.g. "15m", "7d"
 */
export function expiresInToMs(expiresIn) {
  const s = String(expiresIn ?? "15m").trim();
  const m = s.match(/^(\d+)([smhd])$/i);
  if (!m) return 15 * 60 * 1000;
  const n = Number.parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * (mult[u] ?? 60_000);
}

/**
 * @returns {import("express").CookieOptions}
 */
export function getAuthCookieOptions() {
  const raw = process.env.COOKIE_SAME_SITE?.toLowerCase();
  const sameSite =
    raw === "none" || raw === "lax" || raw === "strict"
      ? raw
      : process.env.NODE_ENV === "production"
        ? "none"
        : "lax";
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    sameSite === "none";
  return {
    httpOnly: true,
    secure: Boolean(secure),
    sameSite: sameSite === "none" ? "none" : sameSite === "strict" ? "strict" : "lax",
    path: "/",
  };
}

/**
 * @param {import("express").Response} res
 * @param {string} accessToken
 * @param {string} refreshToken
 */
export function setAuthTokenCookies(res, accessToken, refreshToken) {
  const base = getAuthCookieOptions();
  const accessMs = expiresInToMs(getAccessTokenOptions().expiresIn);
  const refreshMs = expiresInToMs(getRefreshTokenOptions().expiresIn);
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, { ...base, maxAge: accessMs });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...base, maxAge: refreshMs });
}

/**
 * @param {import("express").Response} res
 */
export function clearAuthTokenCookies(res) {
  const base = getAuthCookieOptions();
  res.clearCookie(ACCESS_TOKEN_COOKIE, base);
  res.clearCookie(REFRESH_TOKEN_COOKIE, base);
}
