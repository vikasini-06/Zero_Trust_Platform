const crypto = require('crypto');
const Session = require('../models/Session');
const Device = require('../models/Device');
const { logEvent, createSecurityAlert, getSocketIO } = require('./auditService');

const SESSION_DURATION_HOURS = 24;

const createSession = async ({ user, device, req, riskScore = 15, riskFactors = [] }) => {
  const sessionId = 'ses_' + crypto.randomBytes(24).toString('hex');
  const now = new Date();
  const expiryTime = new Date(now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';
  const location = req.headers['x-client-location'] || device?.location || 'Corporate HQ, US';

  const session = await Session.create({
    sessionId,
    user: user._id,
    device: device?._id,
    deviceId: device?.deviceId || 'dev_unknown',
    ipAddress,
    userAgent,
    location,
    loginTime: now,
    lastActivity: now,
    expiryTime,
    status: 'Active',
    riskScore,
    riskFactors,
  });

  await logEvent({
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    action: 'SESSION_CREATED',
    resource: 'Session',
    resourceId: session.sessionId,
    ipAddress,
    deviceId: device?.deviceId,
    status: 'SUCCESS',
    riskScore,
    details: { sessionId: session.sessionId, deviceId: device?.deviceId, location },
  });

  return session;
};

const validateSession = async (sessionId) => {
  if (!sessionId) return null;

  const session = await Session.findOne({ sessionId }).populate('user').populate('device');
  if (!session) return null;

  // Check if session status is revoked or expired
  if (session.status === 'Revoked' || session.status === 'Expired') {
    return { valid: false, reason: `Session is ${session.status.toLowerCase()}`, session };
  }

  // Check if session expired by time
  if (new Date() > new Date(session.expiryTime)) {
    session.status = 'Expired';
    await session.save();
    return { valid: false, reason: 'Session expired', session };
  }

  // Continuous verification: check device status
  if (session.device && session.device.status === 'Blocked') {
    session.status = 'Revoked';
    session.revokedReason = 'Associated device was BLOCKED by administrator';
    session.revokedAt = new Date();
    await session.save();

    const io = getSocketIO();
    if (io) {
      io.emit(`session_revoked_${session.sessionId}`, { reason: session.revokedReason });
    }

    return { valid: false, reason: 'Device is blocked', session };
  }

  // Update heartbeat lastActivity
  session.lastActivity = new Date();
  await session.save();

  return { valid: true, session };
};

const revokeSession = async (sessionId, revokedBy = null, reason = 'Administrative revocation') => {
  const session = await Session.findOne({ sessionId }).populate('user');
  if (!session) return null;

  session.status = 'Revoked';
  session.revokedAt = new Date();
  session.revokedBy = revokedBy?._id || null;
  session.revokedReason = reason;
  await session.save();

  await logEvent({
    userId: revokedBy?._id || session.user?._id,
    userName: revokedBy?.name || session.user?.name,
    userEmail: revokedBy?.email || session.user?.email,
    action: 'SESSION_REVOKED',
    resource: 'Session',
    resourceId: session.sessionId,
    ipAddress: session.ipAddress,
    deviceId: session.deviceId,
    status: 'SUCCESS',
    riskScore: session.riskScore,
    details: { sessionId, revokedBy: revokedBy?.email || 'Self', reason },
  });

  const io = getSocketIO();
  if (io) {
    io.emit(`session_revoked_${session.sessionId}`, { reason });
    io.emit('session_updated', session);
  }

  return session;
};

const revokeAllUserSessions = async (userId, reason = 'Security policy enforcement') => {
  const sessions = await Session.find({ user: userId, status: 'Active' });
  const revoked = [];

  for (const session of sessions) {
    session.status = 'Revoked';
    session.revokedAt = new Date();
    session.revokedReason = reason;
    await session.save();
    revoked.push(session);

    const io = getSocketIO();
    if (io) {
      io.emit(`session_revoked_${session.sessionId}`, { reason });
    }
  }

  return revoked;
};

module.exports = {
  createSession,
  validateSession,
  revokeSession,
  revokeAllUserSessions,
};
