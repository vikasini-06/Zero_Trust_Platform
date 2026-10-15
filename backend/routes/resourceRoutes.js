const express = require('express');
const router = express.Router();
const {
  getResources,
  getResourceById,
  evaluateLiveAccess,
} = require('../controllers/accessRequestController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Enterprise Protected Resources Catalog & Individual Posture Evaluation
router.get('/', getResources);
router.get('/:id', getResourceById);
router.post('/verify-access', evaluateLiveAccess);

module.exports = router;
