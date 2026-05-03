const express = require('express');
const router = express.Router();
const { signup, login, refreshToken, logout, getMe, updateMe, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupValidators, loginValidators, changePasswordValidators } = require('../validators/auth.validators');

// Public routes
router.post('/signup', signupValidators, validate, signup);
router.post('/login', loginValidators, validate, login);
router.post('/refresh', refreshToken);

// Protected routes
router.use(authenticate);
router.post('/logout', logout);
router.get('/me', getMe);
router.patch('/me', updateMe);
router.patch('/change-password', changePasswordValidators, validate, changePassword);

module.exports = router;
