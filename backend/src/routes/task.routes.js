const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :projectId
const {
  getTasksByProject, createTask,
} = require('../controllers/task.controller');
const validate = require('../middleware/validate');
const { createTaskValidators } = require('../validators/task.validators');

// These routes are mounted under /api/v1/projects/:projectId/tasks
router.get('/', getTasksByProject);
router.post('/', createTaskValidators, validate, createTask);

module.exports = router;
