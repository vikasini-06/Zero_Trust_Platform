const express = require('express');
const router = express.Router();
const {
  getResources,
  getResourceById,
  getAccessRequests,
  getMyAccessRequests,
  createAccessRequest,
  approveAccessRequest,
  rejectAccessRequest,
  evaluateLiveAccess,
} = require('../controllers/accessRequestController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(authenticateToken);

// Catalog of protected resources
router.get('/resources', getResources);
router.get('/resources/:id', getResourceById);

// User access requests
router.get('/me', getMyAccessRequests);
router.post('/', requirePermission('resource:request'), createAccessRequest);

// Real-time Zero Trust Access Decision Checkpoint
router.post('/verify-access', evaluateLiveAccess);

// Manager / SOC / Admin approvals
router.get('/', requirePermission('resource:approve'), getAccessRequests);
router.put('/:id/approve', requirePermission('resource:approve'), approveAccessRequest);
router.put('/:id/reject', requirePermission('resource:approve'), rejectAccessRequest);

module.exports = router;
