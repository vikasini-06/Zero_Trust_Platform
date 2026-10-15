const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  unlockUser,
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(authenticateToken);

router.get('/', requirePermission('user:read'), getUsers);
router.get('/:id', requirePermission('user:read'), getUserById);
router.post('/', requirePermission('user:create'), createUser);
router.put('/:id', requirePermission('user:update'), updateUser);
router.delete('/:id', requirePermission('user:delete'), deleteUser);
router.put('/:id/unlock', requirePermission('user:update'), unlockUser);

module.exports = router;
