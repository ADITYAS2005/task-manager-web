const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const projectRoutes = require('./project.routes');
const taskStandaloneRoutes = require('./taskStandalone.routes');
const userRoutes = require('./user.routes');

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskStandaloneRoutes);
router.use('/users', userRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'TaskFlow API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

module.exports = router;
