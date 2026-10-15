const { validateSession } = require('../services/sessionService');

const verifyActiveSession = async (req, res, next) => {
  const sessionId = req.headers['x-session-id'] || req.tokenPayload?.sessionId;

  if (!sessionId) {
    // If route doesn't strictly enforce an existing session or during pre-auth
    return next();
  }

  const result = await validateSession(sessionId);

  if (!result || !result.valid) {
    return res.status(401).json({
      success: false,
      message: result?.reason || 'Session is invalid or has been revoked',
      errorCode: 'SESSION_REVOKED',
    });
  }

  req.sessionRecord = result.session;
  req.device = result.session.device;
  next();
};

module.exports = {
  verifyActiveSession,
};
