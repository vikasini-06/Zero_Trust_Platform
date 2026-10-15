const mongoose = require('mongoose');

const SecurityAlertSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      // e.g. BRUTE_FORCE_ATTEMPT, SUSPICIOUS_DEVICE, BLOCKED_DEVICE_ACCESS,
      // UNUSUAL_SESSION_BEHAVIOR, MFA_FAILURE_THRESHOLD, PRIVILEGE_ESCALATION
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
    },
    userEmail: {
      type: String,
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
    },
    deviceId: {
      type: String,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Investigating', 'Resolved'],
      default: 'Open',
      index: true,
    },
    riskScore: {
      type: Number,
      default: 50,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNotes: {
      type: String,
    },
    mitigationAction: {
      type: String,
      default: 'Awaiting Administrator Review',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SecurityAlert', SecurityAlertSchema);
