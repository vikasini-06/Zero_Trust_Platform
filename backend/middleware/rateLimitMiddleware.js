const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 authentication requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again in 15 minutes.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Accommodate continuous SOC telemetry and dynamic posture verification
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many API requests, please slow down.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

module.exports = {
  authLimiter,
  generalApiLimiter,
};
