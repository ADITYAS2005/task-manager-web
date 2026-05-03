const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * GET /api/v1/projects/:projectId/tasks
 * Members can view tasks in projects they belong to
 */
const getTasksByProject = catchAsync(async (req, res) => {
  const { status, priority, assignee, page = 1, limit = 50 } = req.query;

  const filter = { project: req.params.projectId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignee = assignee;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Task.countDocuments(filter),
  ]);

  const now = new Date();
  const enriched = tasks.map((t) => ({
    ...t,
    isOverdue: t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now,
  }));

  return ApiResponse.paginated(res, enriched, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/v1/tasks/my
 * Returns tasks assigned to current user across ALL projects.
 * Members see only their assigned tasks.
 * Admins see all tasks.
 */
const getMyTasks = catchAsync(async (req, res) => {
  const { status, priority } = req.query;
  const isAdmin = req.user.role === 'admin';

  // Admins can see all tasks; members only see tasks assigned to them
  const filter = isAdmin ? {} : { assignee: req.user._id };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const tasks = await Task.find(filter)
    .populate('project', 'name color')
    .populate('assignee', 'name email avatar')
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  const now = new Date();
  const enriched = tasks.map((t) => ({
    ...t,
    isOverdue: t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now,
  }));

  return ApiResponse.success(res, { tasks: enriched });
});

/**
 * GET /api/v1/tasks/dashboard-stats
 * Admins: stats across all tasks.
 * Members: stats only for tasks assigned to them.
 */
const getDashboardStats = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const isAdmin = req.user.role === 'admin';

  // Admins see all tasks; members only see their assigned tasks
  const taskFilter = isAdmin ? {} : { assignee: userId };

  const now = new Date();

  const [totalTasks, myTasksCount, statusBreakdown, priorityBreakdown, recentTasks, overdueTasks] =
    await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ assignee: userId }),
      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.find(taskFilter)
        .populate('assignee', 'name avatar')
        .populate('project', 'name color')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Task.countDocuments({
        ...taskFilter,
        status: { $ne: 'done' },
        dueDate: { $lt: now, $ne: null },
      }),
    ]);

  const stats = {
    totalTasks,
    myTasks: myTasksCount,
    overdueTasks,
    statusBreakdown: Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count])),
    priorityBreakdown: Object.fromEntries(priorityBreakdown.map((p) => [p._id, p.count])),
    recentTasks: recentTasks.map((t) => ({
      ...t,
      isOverdue: t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now,
    })),
  };

  return ApiResponse.success(res, { stats });
});

/**
 * POST /api/v1/projects/:projectId/tasks
 */
const createTask = catchAsync(async (req, res) => {
  const { title, description, assignee, priority, status, dueDate, tags } = req.body;

  const task = await Task.create({
    title,
    description,
    project: req.params.projectId,
    assignee: assignee || null,
    createdBy: req.user._id,
    priority,
    status,
    dueDate: dueDate || null,
    tags,
  });

  // Auto-add assignee as project member so they can view the project
  if (assignee) {
    const project = await Project.findById(req.params.projectId);
    if (project) {
      const alreadyMember = project.members.some(
        (m) => m.user.toString() === assignee.toString()
      );
      if (!alreadyMember) {
        project.members.push({ user: assignee, role: 'member' });
        await project.save();
      }
    }
  }

  await task.populate([
    { path: 'assignee', select: 'name email avatar' },
    { path: 'createdBy', select: 'name email' },
  ]);

  return ApiResponse.created(res, { task }, 'Task created successfully');
});

/**
 * GET /api/v1/tasks/:id
 * Members can view a task if they are the assignee OR a project member.
 */
const getTask = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email')
    .populate('project', 'name color')
    .populate('comments.user', 'name avatar');

  if (!task) return ApiResponse.notFound(res, 'Task not found');

  // Access check for members
  if (req.user.role === 'member') {
    const project = await Project.findById(task.project?._id || task.project);
    const isAssignee = task.assignee?._id?.toString() === req.user._id.toString()
      || task.assignee?.toString() === req.user._id.toString();
    const isMember = project && project.isMember(req.user._id);
    if (!isAssignee && !isMember) {
      return ApiResponse.forbidden(res, 'Access denied.');
    }
  }

  return ApiResponse.success(res, { task });
});

/**
 * PATCH /api/v1/tasks/:id
 * Admins: can update all fields.
 * Members: can ONLY update status, and only on tasks assigned to them.
 */
const updateTask = catchAsync(async (req, res) => {
  const { title, description, assignee, priority, status, dueDate, tags, order } = req.body;

  const task = await Task.findById(req.params.id);
  if (!task) return ApiResponse.notFound(res, 'Task not found');

  if (req.user.role === 'member') {
    // Resolve assignee whether it's an ObjectId or populated object
    const assigneeId = task.assignee?._id?.toString() || task.assignee?.toString();
    const isAssignee = assigneeId === req.user._id.toString();

    if (!isAssignee) {
      return ApiResponse.forbidden(res, 'You can only update tasks assigned to you.');
    }

    // Members can ONLY change status
    if (status !== undefined) task.status = status;
    await task.save();
  } else {
    // Admin / owner: full update
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (tags !== undefined) task.tags = tags;
    if (order !== undefined) task.order = order;
    await task.save();
  }

  await task.populate([
    { path: 'assignee', select: 'name email avatar' },
    { path: 'createdBy', select: 'name email' },
  ]);

  return ApiResponse.success(res, { task }, 'Task updated');
});

/**
 * DELETE /api/v1/tasks/:id
 */
const deleteTask = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return ApiResponse.notFound(res, 'Task not found');
  await task.deleteOne();
  return ApiResponse.success(res, null, 'Task deleted');
});

/**
 * POST /api/v1/tasks/:id/comments
 * Any authenticated user who can view the task can comment.
 */
const addComment = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return ApiResponse.notFound(res, 'Task not found');

  // Members can comment only if they are assignee or project member
  if (req.user.role === 'member') {
    const project = await Project.findById(task.project);
    const assigneeId = task.assignee?._id?.toString() || task.assignee?.toString();
    const isAssignee = assigneeId === req.user._id.toString();
    const isMember = project && project.isMember(req.user._id);
    if (!isAssignee && !isMember) {
      return ApiResponse.forbidden(res, 'Access denied.');
    }
  }

  task.comments.push({ user: req.user._id, text: req.body.text });
  await task.save();
  await task.populate('comments.user', 'name avatar');

  return ApiResponse.success(res, { comments: task.comments }, 'Comment added');
});

/**
 * DELETE /api/v1/tasks/:id/comments/:commentId
 */
const deleteComment = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return ApiResponse.notFound(res, 'Task not found');

  const comment = task.comments.id(req.params.commentId);
  if (!comment) return ApiResponse.notFound(res, 'Comment not found');

  if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return ApiResponse.forbidden(res, 'You can only delete your own comments');
  }

  comment.deleteOne();
  await task.save();
  return ApiResponse.success(res, null, 'Comment deleted');
});

module.exports = {
  getTasksByProject, getMyTasks, getDashboardStats,
  createTask, getTask, updateTask, deleteTask,
  addComment, deleteComment,
};
