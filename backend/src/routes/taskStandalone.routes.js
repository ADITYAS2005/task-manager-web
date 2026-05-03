const express = require('express');
const router = express.Router();
const {
  getMyTasks, getDashboardStats,
  getTask, updateTask, deleteTask,
  addComment, deleteComment,
} = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateTaskValidators, addCommentValidators } = require('../validators/task.validators');

router.use(authenticate);

router.get('/my', getMyTasks);
router.get('/dashboard-stats', getDashboardStats);

router.get('/:id', getTask);
router.patch('/:id', updateTaskValidators, validate, updateTask);
router.delete('/:id', deleteTask);

router.post('/:id/comments', addCommentValidators, validate, addComment);
router.delete('/:id/comments/:commentId', deleteComment);

module.exports = router;
