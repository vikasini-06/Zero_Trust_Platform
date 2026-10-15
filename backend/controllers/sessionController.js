const Session = require('../models/Session');
const { revokeSession } = require('../services/sessionService');

/**
 * @route   GET /api/sessions
 * @desc    Get all active/recent sessions across enterprise (Admin/Security Admin)
 */
const getSessions = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) query.status = status;

    const sessions = await Session.find(query)
      .populate('user', 'name email roleName department')
      .populate('device')
      .sort({ lastActivity: -1 });

    let filtered = sessions;
    if (search) {
      const s = search.toLowerCase();
      filtered = sessions.filter(
        (ses) =>
          ses.user?.name?.toLowerCase().includes(s) ||
          ses.user?.email?.toLowerCase().includes(s) ||
          ses.ipAddress?.includes(s) ||
          ses.deviceId?.includes(s) ||
          ses.sessionId?.includes(s)
      );
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/sessions/me
 * @desc    Get current user's active and past sessions
 */
const getMySessions = async (req, res, next) => {
  try {
    const currentSessionId = req.headers['x-session-id'] || req.tokenPayload?.sessionId;

    const sessions = await Session.find({ user: req.user._id })
      .populate('device')
      .sort({ lastActivity: -1 });

    const formatted = sessions.map((s) => ({
      ...s.toObject(),
      isCurrent: s.sessionId === currentSessionId,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/sessions/:id
 * @desc    Admin revokes an active session by sessionId
 */
const revokeSessionById = async (req, res, next) => {
  try {
    const { id } = req.params; // Can be sessionId or _id
    const { reason = 'Revoked by Security Operations Center' } = req.body;

    const session = await Session.findOne({
      $or: [{ sessionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
        errorCode: 'SESSION_NOT_FOUND',
      });
    }

    const updated = await revokeSession(session.sessionId, req.user, reason);

    return res.status(200).json({
      success: true,
      message: `Session ${session.sessionId} has been forcefully revoked.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/sessions/me/:id
 * @desc    User revokes their own session
 */
const revokeMySession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await Session.findOne({
      user: req.user._id,
      $or: [{ sessionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or belongs to another user',
        errorCode: 'SESSION_NOT_FOUND',
      });
    }

    const updated = await revokeSession(session.sessionId, req.user, 'Terminated by user from portal');

    return res.status(200).json({
      success: true,
      message: 'Session revoked successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSessions,
  getMySessions,
  revokeSessionById,
  revokeMySession,
};
