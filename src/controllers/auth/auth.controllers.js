import { User } from "../../models/user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { hashToken, compareTokenHash } from "../../utils/cryptoHash.util.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.util.js";
import {
  clearAuthTokenCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthTokenCookies,
} from "../../utils/authCookies.util.js";

function toPublicUser(doc) {
  return {
    id: doc._id.toString(),
    email: doc.email,
    roles: doc.roles,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function issueTokenPair(userDoc) {
  const accessToken = signAccessToken(userDoc);
  const refreshToken = signRefreshToken(userDoc);
  userDoc.refreshTokenHash = hashToken(refreshToken);
  await userDoc.save({ validateModifiedOnly: true });
  return { accessToken, refreshToken };
}

const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.create({ email, password });
    const { accessToken, refreshToken } = await issueTokenPair(user);
    setAuthTokenCookies(res, accessToken, refreshToken);
    return res.status(201).json(
      new ApiResponse(201, { user: toPublicUser(user) }, "Registered successfully")
    );
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      throw new ApiError(409, "Email already registered");
    }
    throw err;
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await issueTokenPair(user);
  setAuthTokenCookies(res, accessToken, refreshToken);
  return res.status(200).json(
    new ApiResponse(200, { user: toPublicUser(user) }, "Logged in successfully")
  );
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
  if (!refreshToken || typeof refreshToken !== "string") {
    clearAuthTokenCookies(res);
    throw new ApiError(401, "Refresh token required");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (e) {
    clearAuthTokenCookies(res);
    throw e;
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    clearAuthTokenCookies(res);
    throw new ApiError(401, "Invalid refresh token");
  }

  if (!compareTokenHash(refreshToken, user.refreshTokenHash)) {
    clearAuthTokenCookies(res);
    throw new ApiError(401, "Invalid refresh token");
  }

  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save({ validateModifiedOnly: true });

  setAuthTokenCookies(res, accessToken, newRefreshToken);
  return res
    .status(200)
    .json(new ApiResponse(200, { user: toPublicUser(user) }, "Tokens refreshed"));
});

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    $set: { refreshTokenHash: null },
  });
  clearAuthTokenCookies(res);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { user: toPublicUser(user) }, "Profile"));
});

export { register, login, refresh, logout, me };
