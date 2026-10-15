const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditStats } = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(authenticateToken);

router.get('/', requirePermission('audit:read'), getAuditLogs);
router.get('/stats', requirePermission('audit:read'), getAuditStats);

module.exports = router;
