const { body } = require('express-validator');

const createTaskValidators = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 2, max: 200 }).withMessage('Title must be 2–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('assignee')
    .optional()
    .isMongoId().withMessage('Invalid assignee ID'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),

  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'done']).withMessage('Invalid status'),

  body('dueDate')
    .optional()
    .isISO8601().withMessage('Due date must be a valid ISO date'),

  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((tags) => tags.every((t) => typeof t === 'string' && t.length <= 30))
    .withMessage('Each tag must be a string max 30 chars'),
];

const updateTaskValidators = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Title must be 2–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('assignee')
    .optional({ nullable: true })
    .isMongoId().withMessage('Invalid assignee ID'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),

  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'done']).withMessage('Invalid status'),

  body('dueDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Due date must be a valid ISO date'),
];

const addCommentValidators = [
  body('text')
    .trim()
    .notEmpty().withMessage('Comment text is required')
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
];

module.exports = { createTaskValidators, updateTaskValidators, addCommentValidators };
