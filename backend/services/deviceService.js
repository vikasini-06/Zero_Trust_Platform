const crypto = require('crypto');
const Device = require('../models/Device');

const parseUserAgent = (userAgentString = '') => {
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceType = 'Laptop';

  const ua = userAgentString.toLowerCase();

  // OS detection
  if (ua.includes('windows nt 10') || ua.includes('windows nt 11')) os = 'Windows 11/10';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) {
    os = 'Android';
    deviceType = 'Mobile';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    deviceType = ua.includes('ipad') ? 'Tablet' : 'Mobile';
  }

  // Browser detection
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';

  return { browser, os, deviceType };
};

const extractDeviceMetadata = (req) => {
  const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';
  const parsed = parseUserAgent(userAgent);
  
  // Clean client IP
  let ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (ipAddress.includes('::ffff:')) {
    ipAddress = ipAddress.replace('::ffff:', '');
  }
  if (ipAddress === '::1') ipAddress = '127.0.0.1';

  // Privacy-conscious Device ID (passed from client storage or generated consistently from client signature)
  let deviceId = req.headers['x-device-id'];
  if (!deviceId) {
    const rawFingerprint = `${userAgent}|${ipAddress}|${req.headers['accept-language'] || ''}`;
    deviceId = 'dev_' + crypto.createHash('sha256').update(rawFingerprint).digest('hex').slice(0, 16);
  }

  const deviceName = req.headers['x-device-name'] || `${parsed.os} ${parsed.browser} Device`;

  return {
    deviceId,
    deviceName,
    browser: parsed.browser,
    os: parsed.os,
    deviceType: parsed.deviceType,
    ipAddress,
    userAgent,
    location: req.headers['x-client-location'] || 'Corporate HQ, US',
  };
};

const getOrCreateDevice = async (user, metadata) => {
  let device = await Device.findOne({ user: user._id, deviceId: metadata.deviceId });

  if (!device) {
    // New device detected for user!
    // Check if user has no other devices - if first device and user is Admin, we can trust or default to Pending
    const existingCount = await Device.countDocuments({ user: user._id });
    
    // First device for a user can be marked Trusted if configured or Pending
    const isInitialDevice = existingCount === 0;
    const status = isInitialDevice ? 'Trusted' : 'Pending';

    device = await Device.create({
      user: user._id,
      deviceId: metadata.deviceId,
      deviceName: metadata.deviceName,
      browser: metadata.browser,
      os: metadata.os,
      deviceType: metadata.deviceType,
      ipAddress: metadata.ipAddress,
      location: metadata.location,
      status,
      riskScore: status === 'Trusted' ? 10 : 35,
      firstSeen: new Date(),
      lastActive: new Date(),
    });

    return { device, isNew: true };
  }

  // Update existing device active metadata
  device.lastActive = new Date();
  device.ipAddress = metadata.ipAddress;
  device.browser = metadata.browser;
  device.os = metadata.os;
  await device.save();

  return { device, isNew: false };
};

module.exports = {
  extractDeviceMetadata,
  getOrCreateDevice,
};
