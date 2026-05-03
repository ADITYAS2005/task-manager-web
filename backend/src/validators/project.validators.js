const { body, param } = require('express-validator');

const createProjectValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex code'),

  body('dueDate')
    .optional()
    .isISO8601().withMessage('Due date must be a valid date'),
];

const updateProjectValidators = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex code'),

  body('status')
    .optional()
    .isIn(['active', 'archived', 'completed']).withMessage('Invalid status'),
];

const addMemberValidators = [
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID'),

  body('role')
    .optional()
    .isIn(['admin', 'member']).withMessage('Role must be admin or member'),
];

module.exports = { createProjectValidators, updateProjectValidators, addMemberValidators };
