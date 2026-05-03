const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * GET /api/v1/projects
 * Returns all projects where user is owner or member (admin sees all)
 */
const getProjects = catchAsync(async (req, res) => {
  const query =
    req.user.role === 'admin'
      ? {}
      : { $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] };

  const projects = await Project.find(query)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .sort({ createdAt: -1 })
    .lean();

  // Attach task stats
  const projectIds = projects.map((p) => p._id);
  const taskStats = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    {
      $group: {
        _id: '$project',
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$status', 'done'] },
                  { $lt: ['$dueDate', new Date()] },
                  { $ne: ['$dueDate', null] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const statsMap = {};
  taskStats.forEach((s) => { statsMap[s._id.toString()] = s; });

  const enriched = projects.map((p) => ({
    ...p,
    stats: statsMap[p._id.toString()] || { total: 0, done: 0, overdue: 0 },
  }));

  return ApiResponse.success(res, { projects: enriched });
});

/**
 * POST /api/v1/projects
 */
const createProject = catchAsync(async (req, res) => {
  const { name, description, color, dueDate } = req.body;

  const project = await Project.create({
    name,
    description,
    color,
    dueDate,
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'owner' }],
  });

  await project.populate('owner', 'name email avatar');
  return ApiResponse.created(res, { project }, 'Project created successfully');
});

/**
 * GET /api/v1/projects/:id
 */
const getProject = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar role');

  if (!project) return ApiResponse.notFound(res, 'Project not found');

  return ApiResponse.success(res, { project });
});

/**
 * PATCH /api/v1/projects/:id
 */
const updateProject = catchAsync(async (req, res) => {
  const { name, description, color, status, dueDate } = req.body;
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { ...(name && { name }), description, color, status, dueDate },
    { new: true, runValidators: true }
  ).populate('owner', 'name email avatar').populate('members.user', 'name email avatar');

  if (!project) return ApiResponse.notFound(res, 'Project not found');
  return ApiResponse.success(res, { project }, 'Project updated');
});

/**
 * DELETE /api/v1/projects/:id
 */
const deleteProject = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return ApiResponse.notFound(res, 'Project not found');

  // Delete all tasks in this project
  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  return ApiResponse.success(res, null, 'Project and all its tasks deleted');
});

/**
 * GET /api/v1/projects/:id/members
 */
const getMembers = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('members.user', 'name email avatar role createdAt');

  if (!project) return ApiResponse.notFound(res, 'Project not found');
  return ApiResponse.success(res, { members: project.members });
});

/**
 * POST /api/v1/projects/:id/members
 */
const addMember = catchAsync(async (req, res) => {
  const { userId, role } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) return ApiResponse.notFound(res, 'Project not found');

  const user = await User.findById(userId);
  if (!user) return ApiResponse.notFound(res, 'User not found');

  const alreadyMember = project.members.some((m) => m.user.toString() === userId);
  if (alreadyMember) return ApiResponse.conflict(res, 'User is already a member of this project');

  project.members.push({ user: userId, role: role || 'member' });
  await project.save();
  await project.populate('members.user', 'name email avatar');

  return ApiResponse.success(res, { members: project.members }, 'Member added');
});

/**
 * DELETE /api/v1/projects/:id/members/:userId
 */
const removeMember = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return ApiResponse.notFound(res, 'Project not found');

  if (project.owner.toString() === req.params.userId) {
    return ApiResponse.badRequest(res, 'Cannot remove the project owner');
  }

  project.members = project.members.filter((m) => m.user.toString() !== req.params.userId);
  await project.save();

  return ApiResponse.success(res, null, 'Member removed');
});

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, getMembers, addMember, removeMember };
