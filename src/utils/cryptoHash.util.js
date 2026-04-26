import crypto from "crypto";

/**
 * @param {string} token
 * @returns {string} hex-encoded SHA-256 digest
 */
export function hashToken(token) {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * @param {string} token
 * @param {string | undefined} storedHex
 */
export function compareTokenHash(token, storedHex) {
  if (!storedHex) return false;
  try {
    const a = Buffer.from(hashToken(token), "hex");
    const b = Buffer.from(storedHex, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
