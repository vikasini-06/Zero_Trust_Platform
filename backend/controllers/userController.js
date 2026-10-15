const User = require('../models/User');
const Role = require('../models/Role');
const Device = require('../models/Device');
const Session = require('../models/Session');
const { logEvent } = require('../services/auditService');
const { revokeAllUserSessions } = require('../services/sessionService');

/**
 * @route   GET /api/users
 * @desc    Get all enterprise users (Admin/Manager)
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.roleName = role;
    }

    if (status) {
      query.status = status;
    }

    const users = await User.find(query).populate('role').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Get single user with associated devices and sessions
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('role');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      });
    }

    const devices = await Device.find({ user: user._id });
    const sessions = await Session.find({ user: user._id }).sort({ loginTime: -1 });

    return res.status(200).json({
      success: true,
      data: {
        user,
        devices,
        sessions,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/users
 * @desc    Admin creates a new user
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, roleName = 'Employee', department, title } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
        errorCode: 'EMAIL_ALREADY_EXISTS',
      });
    }

    const role = await Role.findOne({ name: roleName }) || await Role.findOne({ name: 'Employee' });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role._id,
      roleName: role.name,
      department: department || 'Security Operations',
      title: title || 'Analyst',
      status: 'Active',
    });

    await logEvent({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'USER_CREATED',
      resource: 'User',
      resourceId: user._id.toString(),
      ipAddress: req.ip,
      status: 'SUCCESS',
      riskScore: 10,
      details: { createdUser: user.email, role: user.roleName },
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/users/:id
 * @desc    Update user details or role
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, department, title, roleName, status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      });
    }

    if (name) user.name = name;
    if (department) user.department = department;
    if (title) user.title = title;
    if (status) user.status = status;

    if (roleName && roleName !== user.roleName) {
      const newRole = await Role.findOne({ name: roleName });
      if (newRole) {
        user.role = newRole._id;
        user.roleName = newRole.name;

        await logEvent({
          userId: req.user._id,
          userName: req.user.name,
          userEmail: req.user.email,
          action: 'ROLE_CHANGED',
          resource: 'User',
          resourceId: user._id.toString(),
          ipAddress: req.ip,
          status: 'SUCCESS',
          riskScore: 20,
          details: { targetUser: user.email, newRole: roleName },
        });
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user and revoke all sessions
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      });
    }

    // Revoke all sessions
    await revokeAllUserSessions(user._id, 'User account deleted by administrator');
    await User.findByIdAndDelete(req.params.id);

    await logEvent({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'USER_DELETED',
      resource: 'User',
      resourceId: req.params.id,
      ipAddress: req.ip,
      status: 'WARNING',
      riskScore: 30,
      details: { deletedEmail: user.email },
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted and active sessions revoked',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/users/:id/unlock
 * @desc    Unlock locked account
 */
const unlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.status = 'Active';
    await user.save();

    await logEvent({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'USER_UNLOCKED',
      resource: 'User',
      resourceId: user._id.toString(),
      ipAddress: req.ip,
      status: 'SUCCESS',
      riskScore: 10,
      details: { unlockedUser: user.email },
    });

    return res.status(200).json({
      success: true,
      message: `Account for ${user.email} has been unlocked successfully.`,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  unlockUser,
};
