const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../module/useModule");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { zohoMail } = require("../utils/email");

/* ================================================================
   🔐 Token Settings
================================================================= */
const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/* ================================================================
   🔑 JWT Signer
================================================================= */
const signAccessToken = (userId, deviceId) =>
  jwt.sign({ id: userId, deviceId }, process.env.JWT_SECRET, {
    expiresIn: `${ACCESS_TOKEN_EXPIRY_MINUTES}m`,
  });

const cookieOptions = (days) => ({
  expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: true, // must be true if SameSite=None
  sameSite: "None", // required for cross-origin cookies
});

/* ================================================================
   🧩 Create + Send Tokens (Access token NOT stored)
================================================================= */
const createSendTokens = async (user, statusCode, res, deviceId) => {
  // Generate JWT + Refresh Token
  const accessToken = signAccessToken(user._id, deviceId);
  const refreshToken = crypto.randomBytes(40).toString("hex");

  // Remove expired refresh tokens
  await user.removeExpiredTokens();

  // Store only the refresh token (hashed)
  await user.addToken(refreshToken, deviceId, REFRESH_TOKEN_EXPIRY_DAYS, "refreshTokens");

  // Clear OTP fields
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save({ validateBeforeSave: false });

  const { otp, otpExpires, refreshTokens, password, ...safeUser } = user.toObject();

  // Cookies (optional)
  res.cookie("jwt", accessToken, cookieOptions(1));
  res.cookie("refreshToken", refreshToken, cookieOptions(REFRESH_TOKEN_EXPIRY_DAYS));

  // Send tokens to frontend
  res.status(statusCode).json({
    status: "success",
    message: "Login successful",
    accessToken,
    refreshToken: { refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    user: safeUser,
  });
};

/* ================================================================
   📩 Request OTP
================================================================= */
exports.requestOtp = catchAsync(async (req, res, next) => {
  const { email, phoneNumber } = req.body;
  if (!email && !phoneNumber) return next(new AppError("Email or phone number required", 400));

  let user = await User.findOne({ $or: [{ email }, { phoneNumber }] });
  if (!user) user = await User.create({ email, phoneNumber, active: false });

  const otp = user.createOTP();
  await user.save({ validateBeforeSave: false });

  await zohoMail({
    toAddress: email,
    subject: "Your Login OTP",
    message: `Your OTP is ${otp}. It expires in 3 minutes.`,
  });

  res.status(200).json({ status: "success", message: "OTP sent successfully" });
});

/* ================================================================
   ✅ Verify OTP & Issue Tokens
================================================================= */
exports.verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otp, deviceId } = req.body;

  if (!email || !otp || !deviceId)
    return next(new AppError("Email, OTP, and device ID required", 400));

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 404));

  const isValid = user.verifyOTP(otp);
  if (!isValid) return next(new AppError("Invalid or expired OTP", 400));

  user.active = true;
  await createSendTokens(user, 200, res, deviceId);
});

/* ================================================================
   ♻️ Refresh Access Token
================================================================= */
exports.refreshToken = catchAsync(async (req, res, next) => {
  console.log("Refreshing token...");
  const rawToken =
    req.cookies?.refreshToken ||
    (req.headers.authorization?.startsWith("Bearer") && req.headers.authorization.split(" ")[1]);

  const deviceId = req.headers["device-id"];

  if (!rawToken || !deviceId)
    return next(new AppError("Refresh token and device ID required", 401));

  const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");

  const user = await User.findOne({
    "refreshTokens.tokenHash": hashed,
    "refreshTokens.deviceId": deviceId,
  });
  if (!user) return next(new AppError("Invalid refresh token", 401));

  const valid = user.verifyRefreshToken(rawToken, deviceId);
  if (!valid) {
    await user.removeExpiredTokens();
    return next(new AppError("Expired or invalid refresh token", 401));
  }

  const newAccessToken = signAccessToken(user._id, deviceId);
  res.cookie("jwt", newAccessToken, cookieOptions(1));

  res.status(200).json({
    status: "success",
    accessToken: newAccessToken,
    expiresIn: ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000,
  });
});
/* ================================================================
   🚪 Logout (Per Device)
================================================================= */
exports.logout = catchAsync(async (req, res, next) => {
  const user = req.user;
  const deviceId = req.deviceId;

  const checkIsUserActive = Array.isArray(user.refreshTokens)
    ? user.refreshTokens.filter(rt => rt.deviceId === deviceId)
    : [];

  if (checkIsUserActive.length === 0) {
    return next(new AppError("User not logged in on this device", 400));
  }

  const initialTokenCount = user.refreshTokens.length;
  user.refreshTokens = user.refreshTokens.filter(rt => rt.deviceId !== deviceId);

  if (user.refreshTokens.length !== initialTokenCount) {
    await user.save({ validateBeforeSave: false });
  }

  res.clearCookie("jwt", { httpOnly: true, sameSite: "strict" });
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });

  return res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

/* ================================================================
   🧱 Protect Middleware (JWT Validation)
================================================================= */
exports.protect = catchAsync(async (req, res, next) => {
  let token =
    req.headers.authorization?.startsWith("Bearer") &&
    req.headers.authorization.split(" ")[1];


  console.log('kjbijbihbiu')

  const deviceId = req.headers["device-id"] || req.headers["x-device-id"];
  if (!token && req.cookies?.jwt) token = req.cookies.jwt;

  if (!token) return next(new AppError("Not logged in", 401));
  if (!deviceId) return next(new AppError("Device ID is required", 400));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new AppError("User not found", 404));

    req.user = user;
    req.deviceId = deviceId;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Session expired. Please login again.", 401));
    }
    return next(new AppError("Invalid token", 401));
  }
});


/* ================================================================
   👤 Get Current User
================================================================= */
exports.getMe = catchAsync(async (req, res, next) => {
  const { password, refreshTokens, otp, otpExpires, ...safeUser } = req.user.toObject();
  res.status(200).json({ status: "success", data: { user: safeUser } });
});

/* ================================================================
   🔒 Restrict To (Roles)
================================================================= */
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) return next(new AppError("Permission denied", 403));
    next();
  };
