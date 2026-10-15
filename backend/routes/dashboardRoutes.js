const express = require('express');
const router = express.Router();
const { getOverviewStats, getEmployeeDashboard } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/overview', getOverviewStats);
router.get('/employee', getEmployeeDashboard);

module.exports = router;
