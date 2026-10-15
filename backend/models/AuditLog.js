const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userName: {
      type: String,
      default: 'Anonymous / System',
    },
    userEmail: {
      type: String,
      default: 'system@zerotrust.local',
    },
    action: {
      type: String,
      required: true,
      index: true,
      // Examples: LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, MFA_SUCCESS, MFA_FAILED,
      // DEVICE_REGISTERED, DEVICE_VERIFIED, DEVICE_BLOCKED, ACCESS_GRANTED,
      // ACCESS_DENIED, SESSION_CREATED, SESSION_REVOKED, ROLE_CHANGED,
      // USER_CREATED, USER_DELETED, PASSWORD_CHANGED, SECURITY_ALERT_CREATED
    },
    resource: {
      type: String,
      default: 'Authentication',
    },
    resourceId: {
      type: String,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    deviceId: {
      type: String,
    },
    deviceInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING', 'BLOCKED'],
      default: 'SUCCESS',
      index: true,
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
