const SecurityAlert = require('../models/SecurityAlert');
const { logEvent } = require('../services/auditService');

/**
 * @route   GET /api/alerts
 * @desc    Get all security alerts (SOC Dashboard)
 */
const getAlerts = async (req, res, next) => {
  try {
    const { status, severity } = req.query;
    const query = {};

    if (status) query.status = status;
    if (severity) query.severity = severity;

    const alerts = await SecurityAlert.find(query)
      .populate('user', 'name email roleName')
      .populate('device')
      .sort({ timestamp: -1 });

    return res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/alerts/:id/resolve
 * @desc    Resolve alert with resolution findings and notes
 */
const resolveAlert = async (req, res, next) => {
  try {
    const { resolutionNotes = 'Investigated and cleared by Security Team' } = req.body;
    const alert = await SecurityAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Security alert not found',
        errorCode: 'ALERT_NOT_FOUND',
      });
    }

    alert.status = 'Resolved';
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    alert.resolutionNotes = resolutionNotes;
    await alert.save();

    await logEvent({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'SECURITY_ALERT_RESOLVED',
      resource: 'SecurityAlert',
      resourceId: alert.alertId,
      ipAddress: req.ip,
      status: 'SUCCESS',
      riskScore: 10,
      details: { alertId: alert.alertId, resolutionNotes },
    });

    return res.status(200).json({
      success: true,
      message: `Alert ${alert.alertId} has been resolved.`,
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/alerts/:id/investigate
 * @desc    Mark alert status as Investigating
 */
const investigateAlert = async (req, res, next) => {
  try {
    const alert = await SecurityAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Security alert not found',
        errorCode: 'ALERT_NOT_FOUND',
      });
    }

    alert.status = 'Investigating';
    await alert.save();

    return res.status(200).json({
      success: true,
      message: `Alert ${alert.alertId} status marked as Investigating.`,
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/alerts/stats
 * @desc    Get aggregate alert metrics
 */
const getAlertStats = async (req, res, next) => {
  try {
    const total = await SecurityAlert.countDocuments();
    const open = await SecurityAlert.countDocuments({ status: 'Open' });
    const investigating = await SecurityAlert.countDocuments({ status: 'Investigating' });
    const resolved = await SecurityAlert.countDocuments({ status: 'Resolved' });

    const critical = await SecurityAlert.countDocuments({ severity: 'CRITICAL', status: { $ne: 'Resolved' } });
    const high = await SecurityAlert.countDocuments({ severity: 'HIGH', status: { $ne: 'Resolved' } });
    const medium = await SecurityAlert.countDocuments({ severity: 'MEDIUM', status: { $ne: 'Resolved' } });
    const low = await SecurityAlert.countDocuments({ severity: 'LOW', status: { $ne: 'Resolved' } });

    return res.status(200).json({
      success: true,
      data: {
        total,
        status: { open, investigating, resolved },
        activeSeverity: { critical, high, medium, low },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAlerts,
  resolveAlert,
  investigateAlert,
  getAlertStats,
};
