const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema(
  {
    resourceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true, // HR, Finance, Engineering, Management, Customer Data
    },
    description: {
      type: String,
      default: '',
    },
    classification: {
      type: String,
      enum: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'],
      default: 'INTERNAL',
    },
    requiredRole: {
      type: [String],
      default: ['Employee', 'Manager', 'Security Admin', 'Super Admin'],
    },
    requiredPermission: {
      type: String,
      default: 'resource:read',
    },
    minTrustLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM', // High requires MFA + Trusted Device
    },
    requiresMFA: {
      type: Boolean,
      default: false,
    },
    endpointUrl: {
      type: String,
      default: '/internal-app',
    },
    icon: {
      type: String,
      default: 'Folder',
    },
    activeUsersCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', ResourceSchema);
