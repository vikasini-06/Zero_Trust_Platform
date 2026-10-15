const AuditLog = require('../models/AuditLog');
const SecurityAlert = require('../models/SecurityAlert');
const logger = require('../utils/logger');

let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
};

const getSocketIO = () => ioInstance;

const logEvent = async ({
  userId = null,
  userName = 'Anonymous / System',
  userEmail = 'system@zerotrust.local',
  action,
  resource = 'Authentication',
  resourceId = null,
  ipAddress = '127.0.0.1',
  deviceId = null,
  deviceInfo = {},
  status = 'SUCCESS',
  riskScore = 0,
  details = {},
}) => {
  try {
    const entry = await AuditLog.create({
      userId,
      userName,
      userEmail,
      action,
      resource,
      resourceId,
      ipAddress,
      deviceId,
      deviceInfo,
      status,
      riskScore,
      details,
      timestamp: new Date(),
    });

    logger.security(action, status, { userId, ipAddress, deviceId, riskScore });

    // Real-time broadcast to connected SOC / Admin dashboards
    if (ioInstance) {
      ioInstance.emit('new_audit_log', entry);
    }

    return entry;
  } catch (err) {
    logger.error('Failed to record audit log entry:', err);
    return null;
  }
};

const createSecurityAlert = async ({
  type,
  severity = 'MEDIUM',
  user = null,
  userName = 'Unknown User',
  userEmail = 'unknown@zerotrust.local',
  device = null,
  deviceId = null,
  ipAddress = '127.0.0.1',
  description,
  riskScore = 50,
  mitigationAction = 'Awaiting Administrator Review',
}) => {
  try {
    const alertCount = await SecurityAlert.countDocuments();
    const alertId = `ALT-${new Date().getFullYear()}-${String(alertCount + 1).padStart(4, '0')}`;

    const alert = await SecurityAlert.create({
      alertId,
      type,
      severity,
      user,
      userName,
      userEmail,
      device,
      deviceId,
      ipAddress,
      description,
      status: 'Open',
      riskScore,
      mitigationAction,
      timestamp: new Date(),
    });

    logger.warn(`[SECURITY ALERT] [${severity}] ${alertId}: ${description}`);

    // Real-time broadcast alert
    if (ioInstance) {
      ioInstance.emit('new_security_alert', alert);
    }

    // Also record this alert creation in the audit log
    await logEvent({
      userId: user,
      userName,
      userEmail,
      action: 'SECURITY_ALERT_CREATED',
      resource: 'SecurityAlert',
      resourceId: alert._id.toString(),
      ipAddress,
      deviceId,
      status: severity === 'CRITICAL' || severity === 'HIGH' ? 'WARNING' : 'SUCCESS',
      riskScore,
      details: { alertId, type, severity, description },
    });

    return alert;
  } catch (err) {
    logger.error('Failed to create security alert:', err);
    return null;
  }
};

module.exports = {
  setSocketIO,
  getSocketIO,
  logEvent,
  createSecurityAlert,
};
