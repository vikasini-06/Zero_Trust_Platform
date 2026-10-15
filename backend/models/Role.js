const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    permissions: {
      type: [String],
      default: [],
    },
    isSystemRole: {
      type: Boolean,
      default: true,
    },
    level: {
      type: Number,
      default: 1, // 1: Employee, 2: Manager, 3: Security Admin, 4: Super Admin
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', RoleSchema);
