const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyMfaLogin,
  setupMfa,
  enableMfa,
  disableMfa,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

// Public authentication routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-mfa', authLimiter, verifyMfaLogin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes (require valid token)
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);
router.post('/change-password', authenticateToken, changePassword);

// MFA Configuration
router.post('/mfa/setup', authenticateToken, setupMfa);
router.post('/mfa/verify-enable', authenticateToken, enableMfa);
router.post('/mfa/disable', authenticateToken, disableMfa);

module.exports = router;
