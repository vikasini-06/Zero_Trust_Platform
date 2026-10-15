const mongoose = require('mongoose');

const AccessRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requesterName: {
      type: String,
      required: true,
    },
    requesterEmail: {
      type: String,
      required: true,
    },
    requesterRole: {
      type: String,
      default: 'Employee',
    },
    resourceId: {
      type: String,
      required: true,
    },
    resourceName: {
      type: String,
      required: true,
    },
    resourceCategory: {
      type: String,
      default: 'Internal App',
    },
    reason: {
      type: String,
      required: [true, 'Please specify the business justification'],
    },
    requestedPermission: {
      type: String,
      enum: ['READ', 'WRITE', 'ADMIN'],
      default: 'READ',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    riskScore: {
      type: Number,
      default: 20,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW',
    },
    riskFactors: {
      type: [String],
      default: [],
    },
    zeroTrustDecision: {
      decision: {
        type: String,
        default: 'ALLOW',
      },
      reason: {
        type: String,
        default: 'Baseline RBAC and trust evaluation',
      },
      score: {
        type: Number,
        default: 20,
      },
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedByName: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AccessRequest', AccessRequestSchema);
