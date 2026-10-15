const express = require('express');
const router = express.Router();
const {
  getSessions,
  getMySessions,
  revokeSessionById,
  revokeMySession,
} = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(authenticateToken);

// User sessions
router.get('/me', getMySessions);
router.delete('/me/:id', revokeMySession);

// Admin / SOC sessions
router.get('/', requirePermission('session:read'), getSessions);
router.delete('/:id', requirePermission('session:revoke'), revokeSessionById);

module.exports = router;
