const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
    },
    deviceId: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: 'Unknown Browser',
    },
    location: {
      type: String,
      default: 'Corporate HQ, US',
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    expiryTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Revoked', 'Suspicious'],
      default: 'Active',
      index: true,
    },
    riskScore: {
      type: Number,
      default: 15,
    },
    riskFactors: {
      type: [String],
      default: [],
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    revokedReason: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', SessionSchema);
