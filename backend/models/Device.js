const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    deviceName: {
      type: String,
      default: 'Workstation',
    },
    browser: {
      type: String,
      default: 'Chrome',
    },
    os: {
      type: String,
      default: 'Windows',
    },
    deviceType: {
      type: String,
      enum: ['Desktop', 'Laptop', 'Mobile', 'Tablet', 'Unknown'],
      default: 'Laptop',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    location: {
      type: String,
      default: 'Corporate HQ, US',
    },
    status: {
      type: String,
      enum: ['Trusted', 'Pending', 'Suspicious', 'Blocked'],
      default: 'Pending',
      index: true,
    },
    riskScore: {
      type: Number,
      default: 20, // 0-100
    },
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    blockedReason: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', DeviceSchema);
