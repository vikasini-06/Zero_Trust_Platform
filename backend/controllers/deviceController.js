const Device = require('../models/Device');
const Session = require('../models/Session');
const { logEvent, createSecurityAlert } = require('../services/auditService');
const { extractDeviceMetadata, getOrCreateDevice } = require('../services/deviceService');
const { revokeSession } = require('../services/sessionService');

/**
 * @route   GET /api/devices
 * @desc    Get all devices across enterprise (Admin/Security Admin)
 */
const getDevices = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { deviceName: { $regex: search, $options: 'i' } },
        { deviceId: { $regex: search, $options: 'i' } },
        { browser: { $regex: search, $options: 'i' } },
        { os: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
      ];
    }

    const devices = await Device.find(query).populate('user', 'name email roleName').sort({ lastActive: -1 });

    return res.status(200).json({
      success: true,
      count: devices.length,
      data: devices,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/devices/me
 * @desc    Get current user's registered devices
 */
const getMyDevices = async (req, res, next) => {
  try {
    const devices = await Device.find({ user: req.user._id }).sort({ lastActive: -1 });
    return res.status(200).json({
      success: true,
      data: devices,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/devices/register
 * @desc    Register or touch device
 */
const registerDevice = async (req, res, next) => {
  try {
    const metadata = extractDeviceMetadata(req);
    const { device, isNew } = await getOrCreateDevice(req.user, metadata);

    if (isNew) {
      await logEvent({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'DEVICE_REGISTERED',
        resource: 'Device',
        resourceId: device.deviceId,
        ipAddress: metadata.ipAddress,
        deviceId: device.deviceId,
        status: 'SUCCESS',
        riskScore: device.riskScore,
        details: { deviceName: device.deviceName, status: device.status },
      });
    }

    return res.status(200).json({
      success: true,
      message: isNew ? 'New device registered' : 'Device recognized',
      data: device,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/devices/:id/verify
 * @desc    Verify and mark device as Trusted (Admin/Security Admin)
 */
const verifyDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id).populate('user');
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
        errorCode: 'DEVICE_NOT_FOUND',
      });
    }

    device.status = 'Trusted';
    device.riskScore = 10;
    device.verifiedBy = req.user._id;
    device.verifiedAt = new Date();
    await device.save();

    await logEvent({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DEVICE_VERIFIED',
      resource: 'Device',
      resourceId: device.deviceId,
      ipAddress: req.ip,
      deviceId: device.deviceId,
      status: 'SUCCESS',
      riskScore: 10,
      details: { verifiedDeviceId: device.deviceId, owner: device.user?.email },
    });

    return res.status(200).json({
      success: true,
      message: `Device [${device.deviceName}] verified and marked as Trusted.`,
      data: device,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/devices/:id/block
 * @desc    Block device and immediately terminate active sessions on this device
 */
const blockDevice = async (req, res, next) => {
  try {
    const { reason = 'High risk posture or unauthorized hardware' } = req.body;
    const device = await Device.findById(req.params.id).populate('user');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
        errorCode: 'DEVICE_NOT_FOUND',
      });
    }

    device.status = 'Blocked';
    device.riskScore = 100;
    device.blockedReason = reason;
    await device.save();

    // Find and terminate all active sessions originating from this device
    const activeSessions = await Session.find({
      deviceId: device.deviceId,
      status: 'Active',
    });

    for (const session of activeSessions) {
      await revokeSession(session.sessionId, req.user, `Device blocked: ${reason}`);
    }

    await createSecurityAlert({
      type: 'DEVICE_BLOCKED_BY_ADMIN',
      severity: 'HIGH',
      user: device.user?._id,
      userName: device.user?.name,
      userEmail: device.user?.email,
      device: device._id,
      deviceId: device.deviceId,
      ipAddress: device.ipAddress,
      description: `Device [${device.deviceName} - ID: ${device.deviceId}] was BLOCKED. ${activeSessions.length} active session(s) severed.`,
      riskScore: 100,
      mitigationAction: 'Hardware blacklisted across enterprise mesh.',
    });

    await logEvent({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DEVICE_BLOCKED',
      resource: 'Device',
      resourceId: device.deviceId,
      ipAddress: req.ip,
      deviceId: device.deviceId,
      status: 'BLOCKED',
      riskScore: 100,
      details: { blockedDeviceId: device.deviceId, owner: device.user?.email, reason },
    });

    return res.status(200).json({
      success: true,
      message: `Device [${device.deviceName}] is now BLOCKED. Active sessions terminated.`,
      data: device,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/devices/:id/unblock
 * @desc    Unblock device and restore to Pending state
 */
const unblockDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id).populate('user');
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
        errorCode: 'DEVICE_NOT_FOUND',
      });
    }

    device.status = 'Pending';
    device.riskScore = 30;
    device.blockedReason = null;
    await device.save();

    await logEvent({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DEVICE_UNBLOCKED',
      resource: 'Device',
      resourceId: device.deviceId,
      ipAddress: req.ip,
      deviceId: device.deviceId,
      status: 'SUCCESS',
      riskScore: 30,
      details: { unblockedDeviceId: device.deviceId, owner: device.user?.email },
    });

    return res.status(200).json({
      success: true,
      message: `Device [${device.deviceName}] unblocked. Status reset to Pending.`,
      data: device,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDevices,
  getMyDevices,
  registerDevice,
  verifyDevice,
  blockDevice,
  unblockDevice,
};
