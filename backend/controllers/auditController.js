const AuditLog = require('../models/AuditLog');

/**
 * @route   GET /api/audit-logs
 * @desc    Get immutable audit log entries with comprehensive search and filtering
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, status, user, search, startDate, endDate, limit = 100, page = 1 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (status) query.status = status;
    if (user) query.userName = { $regex: user, $options: 'i' };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
        { deviceId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/audit-logs/stats
 * @desc    Aggregate audit statistics for SOC visualization
 */
const getAuditStats = async (req, res, next) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    const successCount = await AuditLog.countDocuments({ status: 'SUCCESS' });
    const failureCount = await AuditLog.countDocuments({ status: 'FAILURE' });
    const warningCount = await AuditLog.countDocuments({ status: 'WARNING' });
    const blockedCount = await AuditLog.countDocuments({ status: 'BLOCKED' });

    // Top actions aggregate
    const topActions = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Risk distribution aggregate
    const riskDistribution = [
      { name: 'Low (0-30)', count: await AuditLog.countDocuments({ riskScore: { $lte: 30 } }) },
      { name: 'Medium (31-70)', count: await AuditLog.countDocuments({ riskScore: { $gt: 30, $lte: 70 } }) },
      { name: 'High (71-100)', count: await AuditLog.countDocuments({ riskScore: { $gt: 70 } }) },
    ];

    return res.status(200).json({
      success: true,
      data: {
        totalLogs,
        statusBreakdown: {
          SUCCESS: successCount,
          FAILURE: failureCount,
          WARNING: warningCount,
          BLOCKED: blockedCount,
        },
        topActions,
        riskDistribution,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAuditLogs,
  getAuditStats,
};
