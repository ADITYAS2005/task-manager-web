const express = require('express');
const router = express.Router();
const {
  getProjects, createProject, getProject, updateProject, deleteProject,
  getMembers, addMember, removeMember,
} = require('../controllers/project.controller');
const { authenticate, authorize, authorizeProjectAccess, authorizeProjectAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createProjectValidators, updateProjectValidators, addMemberValidators } = require('../validators/project.validators');
const taskRoutes = require('./task.routes');

// All project routes require authentication
router.use(authenticate);

// Mount task routes under projects
router.use('/:projectId/tasks', authorizeProjectAccess, taskRoutes);

router.get('/', getProjects);
router.post('/', authorize('admin'), createProjectValidators, validate, createProject);

router.get('/:id', authorizeProjectAccess, getProject);
router.patch('/:id', authorizeProjectAccess, authorizeProjectAdmin, updateProjectValidators, validate, updateProject);
router.delete('/:id', authorize('admin'), deleteProject);

// Member management
router.get('/:id/members', authorizeProjectAccess, getMembers);
router.post('/:id/members', authorizeProjectAccess, authorizeProjectAdmin, addMemberValidators, validate, addMember);
router.delete('/:id/members/:userId', authorizeProjectAccess, authorizeProjectAdmin, removeMember);

module.exports = router;
