const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUser, deleteUser } = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getUsers);
router.get('/:id', getUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
