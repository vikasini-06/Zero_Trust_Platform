const sanitize = (data) => {
  if (!data) return data;
  if (typeof data !== 'object') return data;
  const clone = Array.isArray(data) ? [...data] : { ...data };
  const sensitiveKeys = ['password', 'mfaSecret', 'secret', 'token', 'refreshToken', 'credential'];
  for (const key of Object.keys(clone)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      clone[key] = '***REDACTED***';
    } else if (typeof clone[key] === 'object' && clone[key] !== null) {
      clone[key] = sanitize(clone[key]);
    }
  }
  return clone;
};

const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] [ZeroTrust]: ${message}`, Object.keys(meta).length ? JSON.stringify(sanitize(meta)) : '');
  },
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] [ZeroTrust]: ${message}`, Object.keys(meta).length ? JSON.stringify(sanitize(meta)) : '');
  },
  error: (message, error = null, meta = {}) => {
    const timestamp = new Date().toISOString();
    const errMsg = error ? (error.stack || error.message || error) : '';
    console.error(`[${timestamp}] [ERROR] [ZeroTrust]: ${message} ${errMsg}`, Object.keys(meta).length ? JSON.stringify(sanitize(meta)) : '');
  },
  security: (action, status, details = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SECURITY_AUDIT] Action: ${action} | Status: ${status} |`, JSON.stringify(sanitize(details)));
  }
};

module.exports = logger;
