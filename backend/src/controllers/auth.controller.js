const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

// ─── Token helpers ────────────────────────────────────────────────────────────

const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

const sendTokens = async (user, res, statusCode = 200, message = 'Success') => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Save hashed refresh token to DB
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    },
    timestamp: new Date().toISOString(),
  });
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/signup
 */
const signup = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return ApiResponse.conflict(res, 'An account with this email already exists.');
  }

  const user = await User.create({ name, email, password, role: role || 'member' });

  logger.info(`New user registered: ${user.email} (${user.role})`);
  await sendTokens(user, res, 201, 'Account created successfully');
});

/**
 * POST /api/v1/auth/login
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +isActive');
  if (!user || !(await user.comparePassword(password))) {
    return ApiResponse.unauthorized(res, 'Invalid email or password.');
  }

  if (!user.isActive) {
    return ApiResponse.unauthorized(res, 'Account has been deactivated. Contact support.');
  }

  logger.info(`User logged in: ${user.email}`);
  await sendTokens(user, res, 200, 'Login successful');
});

/**
 * POST /api/v1/auth/refresh
 */
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return ApiResponse.unauthorized(res, 'Refresh token required.');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return ApiResponse.unauthorized(res, 'Invalid or expired refresh token.');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    return ApiResponse.unauthorized(res, 'Refresh token revoked or invalid.');
  }

  const newAccessToken = signAccessToken(user._id);
  const newRefreshToken = signRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return ApiResponse.success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Tokens refreshed');
});

/**
 * POST /api/v1/auth/logout
 */
const logout = catchAsync(async (req, res) => {
  req.user.refreshToken = null;
  await req.user.save({ validateBeforeSave: false });
  return ApiResponse.success(res, null, 'Logged out successfully');
});

/**
 * GET /api/v1/auth/me
 */
const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  return ApiResponse.success(res, { user });
});

/**
 * PATCH /api/v1/auth/me
 */
const updateMe = catchAsync(async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { ...(name && { name }), ...(avatar !== undefined && { avatar }) },
    { new: true, runValidators: true }
  );
  return ApiResponse.success(res, { user }, 'Profile updated');
});

/**
 * PATCH /api/v1/auth/change-password
 */
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return ApiResponse.badRequest(res, 'Current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();
  return ApiResponse.success(res, null, 'Password changed successfully');
});

module.exports = { signup, login, refreshToken, logout, getMe, updateMe, changePassword };
