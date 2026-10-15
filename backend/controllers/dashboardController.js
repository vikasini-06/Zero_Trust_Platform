const User = require('../models/User');
const Device = require('../models/Device');
const Session = require('../models/Session');
const SecurityAlert = require('../models/SecurityAlert');
const AccessRequest = require('../models/AccessRequest');
const AuditLog = require('../models/AuditLog');
const Resource = require('../models/Resource');

/**
 * @route   GET /api/dashboard/overview
 * @desc    Comprehensive enterprise dashboard statistics and charts data
 */
const getOverviewStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSessions = await Session.countDocuments({ status: 'Active' });
    const trustedDevices = await Device.countDocuments({ status: 'Trusted' });
    const pendingDevices = await Device.countDocuments({ status: 'Pending' });
    const suspiciousDevices = await Device.countDocuments({ status: 'Suspicious' });
    const blockedDevices = await Device.countDocuments({ status: 'Blocked' });
    const openAlerts = await SecurityAlert.countDocuments({ status: { $ne: 'Resolved' } });
    const pendingAccessRequests = await AccessRequest.countDocuments({ status: 'PENDING' });
    const failedLoginAttempts = await AuditLog.countDocuments({ action: 'LOGIN_FAILED' });

    // Recent activity feed
    const recentActivity = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .select('action userName userEmail timestamp status riskScore resource');

    // Risk distribution
    const lowRiskCount = await Session.countDocuments({ riskScore: { $lte: 30 }, status: 'Active' });
    const medRiskCount = await Session.countDocuments({ riskScore: { $gt: 30, $lte: 70 }, status: 'Active' });
    const highRiskCount = await Session.countDocuments({ riskScore: { $gt: 70 }, status: 'Active' });

    // Alerts by severity
    const criticalAlerts = await SecurityAlert.countDocuments({ severity: 'CRITICAL', status: { $ne: 'Resolved' } });
    const highAlerts = await SecurityAlert.countDocuments({ severity: 'HIGH', status: { $ne: 'Resolved' } });
    const mediumAlerts = await SecurityAlert.countDocuments({ severity: 'MEDIUM', status: { $ne: 'Resolved' } });
    const lowAlerts = await SecurityAlert.countDocuments({ severity: 'LOW', status: { $ne: 'Resolved' } });

    // Device OS breakdown
    const devicesByOS = await Device.aggregate([
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Access Decisions breakdown
    const accessAllowed = await AuditLog.countDocuments({ action: 'ACCESS_GRANTED' });
    const accessDenied = await AuditLog.countDocuments({ action: 'ACCESS_DENIED' });

    // Simulated 7-day timeline of login attempts and security events
    const timelineData = [
      { day: 'Mon', logins: 45, failed: 3, alerts: 1 },
      { day: 'Tue', logins: 52, failed: 2, alerts: 0 },
      { day: 'Wed', logins: 68, failed: 6, alerts: 2 },
      { day: 'Thu', logins: 59, failed: 4, alerts: 1 },
      { day: 'Fri', logins: 74, failed: 7, alerts: 3 },
      { day: 'Sat', logins: 28, failed: 1, alerts: 0 },
      { day: 'Sun', logins: 34, failed: 2, alerts: 1 },
    ];

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeSessions,
          trustedDevices,
          pendingDevices,
          suspiciousDevices,
          blockedDevices,
          openAlerts,
          pendingAccessRequests,
          failedLoginAttempts,
        },
        riskDistribution: [
          { name: 'Low Risk (0-30)', value: lowRiskCount || 12, fill: '#10b981' },
          { name: 'Medium Risk (31-70)', value: medRiskCount || 4, fill: '#f59e0b' },
          { name: 'High Risk (71-100)', value: highRiskCount || 1, fill: '#ef4444' },
        ],
        alertsBySeverity: [
          { name: 'Critical', count: criticalAlerts, fill: '#ef4444' },
          { name: 'High', count: highAlerts, fill: '#f97316' },
          { name: 'Medium', count: mediumAlerts, fill: '#f59e0b' },
          { name: 'Low', count: lowAlerts, fill: '#3b82f6' },
        ],
        devicesByOS: devicesByOS.map((d) => ({ name: d._id || 'Other', count: d.count })),
        accessDecisions: [
          { name: 'Granted', value: accessAllowed || 24, fill: '#10b981' },
          { name: 'Denied / Blocked', value: accessDenied || 5, fill: '#ef4444' },
        ],
        timelineData,
        recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/dashboard/employee
 * @desc    Employee personalized security posture overview
 */
const getEmployeeDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('role');
    const myDevices = await Device.find({ user: user._id });
    const mySessions = await Session.find({ user: user._id, status: 'Active' });
    const myRequests = await AccessRequest.find({ requester: user._id }).sort({ requestedAt: -1 }).limit(5);
    const availableResources = await Resource.find();
    const myRecentActivity = await AuditLog.find({ userId: user._id }).sort({ timestamp: -1 }).limit(8);

    const hasTrustedDevice = myDevices.some((d) => d.status === 'Trusted');
    const devicePosture = hasTrustedDevice ? 'Trusted' : myDevices.length > 0 ? 'Pending' : 'Unregistered';

    // Calculate account posture score (100 is best)
    let postureScore = 80;
    if (user.mfaEnabled) postureScore += 15;
    else postureScore -= 20;

    if (hasTrustedDevice) postureScore += 5;
    else postureScore -= 15;

    postureScore = Math.max(10, Math.min(100, postureScore));

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.roleName,
          department: user.department,
          mfaEnabled: user.mfaEnabled,
        },
        securityStatus: {
          postureScore,
          mfa: user.mfaEnabled ? 'Enabled' : 'Disabled',
          devicePosture,
          activeSessionsCount: mySessions.length,
          overallRisk: postureScore >= 80 ? 'Low' : postureScore >= 50 ? 'Medium' : 'High',
        },
        myDevices,
        mySessions,
        myRequests,
        availableResources,
        myRecentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverviewStats,
  getEmployeeDashboard,
};
