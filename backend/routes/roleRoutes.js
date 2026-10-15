const express = require('express');
const router = express.Router();
const { getRoles, updateRolePermissions } = require('../controllers/roleController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(authenticateToken);

router.get('/', requirePermission('role:read'), getRoles);
router.put('/:id', requirePermission('role:update'), updateRolePermissions);

module.exports = router;
