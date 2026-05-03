const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

/**
 * Authenticate — verifies JWT from Authorization header.
 * Attaches req.user on success.
 */
const authenticate = catchAsync(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.unauthorized(res, 'No token provided. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expired. Please log in again.');
    }
    return ApiResponse.unauthorized(res, 'Invalid token. Please log in again.');
  }

  const user = await User.findById(decoded.id).select('+isActive');
  if (!user) {
    return ApiResponse.unauthorized(res, 'User no longer exists.');
  }
  if (!user.isActive) {
    return ApiResponse.unauthorized(res, 'Account has been deactivated.');
  }

  req.user = user;
  next();
});

/**
 * Authorize — checks global role (admin / member).
 * Must be used AFTER authenticate middleware.
 * Usage: authorize('admin') or authorize('admin', 'member')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(`Forbidden: user ${req.user.id} (${req.user.role}) tried to access restricted route`);
      return ApiResponse.forbidden(res, `Role '${req.user.role}' is not authorized for this action.`);
    }
    next();
  };
};

/**
 * authorizeProjectAccess — checks if user is a member of the project.
 * Attaches req.project on success.
 */
const authorizeProjectAccess = catchAsync(async (req, res, next) => {
  const Project = require('../models/Project');
  const projectId = req.params.projectId || req.params.id;

  const project = await Project.findById(projectId);
  if (!project) {
    return ApiResponse.notFound(res, 'Project not found.');
  }

  // Global admin bypasses project membership check
  if (req.user.role === 'admin') {
    req.project = project;
    return next();
  }

  if (!project.isMember(req.user._id)) {
    return ApiResponse.forbidden(res, 'You are not a member of this project.');
  }

  req.project = project;
  next();
});

/**
 * authorizeProjectAdmin — checks if user is owner or admin of the project.
 * Must run after authorizeProjectAccess.
 */
const authorizeProjectAdmin = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (!req.project.isProjectAdmin(req.user._id)) {
    return ApiResponse.forbidden(res, 'Only project admins can perform this action.');
  }
  next();
};

module.exports = { authenticate, authorize, authorizeProjectAccess, authorizeProjectAdmin };
