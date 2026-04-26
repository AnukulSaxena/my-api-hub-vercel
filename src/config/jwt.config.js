const MIN_SECRET_LENGTH = 32;

/**
 * Ensures JWT secrets are present (and reasonably strong in production).
 * Call after dotenv is loaded (e.g. from app.js).
 */
export function assertJwtEnv() {
  const access = process.env.JWT_ACCESS_SECRET;
  const refresh = process.env.JWT_REFRESH_SECRET;

  if (!access || !refresh) {
    throw new Error(
      "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment"
    );
  }

  if (process.env.NODE_ENV === "production") {
    if (
      access.length < MIN_SECRET_LENGTH ||
      refresh.length < MIN_SECRET_LENGTH
    ) {
      throw new Error(
        `JWT secrets must be at least ${MIN_SECRET_LENGTH} characters in production`
      );
    }
    if (access === refresh) {
      throw new Error(
        "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ in production"
      );
    }
  }
}

export function getAccessTokenOptions() {
  return {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  };
}

export function getRefreshTokenOptions() {
  return {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  };
}
