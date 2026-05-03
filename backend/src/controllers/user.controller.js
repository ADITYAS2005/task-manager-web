const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * GET /api/v1/users  (admin only)
 */
const getUsers = catchAsync(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, users, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/v1/users/:id  (admin only)
 */
const getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return ApiResponse.notFound(res, 'User not found');
  return ApiResponse.success(res, { user });
});

/**
 * PATCH /api/v1/users/:id  (admin only)
 */
const updateUser = catchAsync(async (req, res) => {
  const { name, role, isActive } = req.body;

  if (req.params.id === req.user._id.toString() && role) {
    return ApiResponse.badRequest(res, 'Admins cannot change their own role here. Use profile settings.');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      ...(name && { name }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
    },
    { new: true, runValidators: true }
  );

  if (!user) return ApiResponse.notFound(res, 'User not found');
  return ApiResponse.success(res, { user }, 'User updated');
});

/**
 * DELETE /api/v1/users/:id  (admin only)
 */
const deleteUser = catchAsync(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return ApiResponse.badRequest(res, 'You cannot delete your own account');
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return ApiResponse.notFound(res, 'User not found');

  return ApiResponse.success(res, null, 'User deleted');
});

module.exports = { getUsers, getUser, updateUser, deleteUser };
