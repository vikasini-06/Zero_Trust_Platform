const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid',
        errorCode: 'TOKEN_MISSING',
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token',
        errorCode: 'TOKEN_INVALID',
      });
    }

    const user = await User.findById(decoded.userId).populate('role');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with token no longer exists',
        errorCode: 'USER_NOT_FOUND',
      });
    }

    if (user.status !== 'Active' || user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked or suspended due to security policy',
        errorCode: 'ACCOUNT_LOCKED',
      });
    }

    // Attach user and decoded session token payload
    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Authentication verification failure',
      errorCode: 'AUTH_ERROR',
    });
  }
};

module.exports = {
  authenticateToken,
};
