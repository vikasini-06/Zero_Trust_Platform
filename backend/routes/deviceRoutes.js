const express = require('express');
const router = express.Router();
const {
  getDevices,
  getMyDevices,
  registerDevice,
  verifyDevice,
  blockDevice,
  unblockDevice,
} = require('../controllers/deviceController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(authenticateToken);

// Employee/User routes
router.get('/me', getMyDevices);
router.post('/register', registerDevice);

// SOC & Admin routes
router.get('/', requirePermission('device:read'), getDevices);
router.put('/:id/verify', requirePermission('device:verify'), verifyDevice);
router.put('/:id/block', requirePermission('device:verify'), blockDevice);
router.put('/:id/unblock', requirePermission('device:verify'), unblockDevice);

module.exports = router;
