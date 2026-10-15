const express = require('express');
const router = express.Router();
const {
  getAlerts,
  resolveAlert,
  investigateAlert,
  getAlertStats,
} = require('../controllers/alertController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(authenticateToken);

router.get('/', requirePermission('alert:read'), getAlerts);
router.get('/stats', requirePermission('alert:read'), getAlertStats);
router.put('/:id/resolve', requirePermission('alert:resolve'), resolveAlert);
router.put('/:id/investigate', requirePermission('alert:resolve'), investigateAlert);

module.exports = router;
