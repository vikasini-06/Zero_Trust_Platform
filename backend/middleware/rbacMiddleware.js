const { logEvent } = require('../services/auditService');

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'UNAUTHORIZED',
      });
    }

    const userRole = req.user.roleName || (req.user.role && req.user.role.name);

    if (!allowedRoles.includes(userRole)) {
      // Log unauthorized attempt to audit log
      logEvent({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'ACCESS_DENIED',
        resource: req.originalUrl,
        ipAddress: req.ip,
        status: 'FAILURE',
        riskScore: 65,
        details: {
          reason: 'Role authorization failure',
          userRole,
          allowedRoles,
          method: req.method,
          url: req.originalUrl,
        },
      });

      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of roles [${allowedRoles.join(', ')}]. Your role is '${userRole}'.`,
        errorCode: 'FORBIDDEN_ROLE',
      });
    }

    next();
  };
};

const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'UNAUTHORIZED',
      });
    }

    // Role permissions populated on req.user
    const userPermissions = (req.user.role && req.user.role.permissions) || [];
    const userRole = req.user.roleName || (req.user.role && req.user.role.name);

    // Super Admin has wildcard access
    if (userRole === 'Super Admin') {
      return next();
    }

    // Check if user has all required permissions
    const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      const missing = requiredPermissions.filter((perm) => !userPermissions.includes(perm));

      // Log authorization denial
      logEvent({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'ACCESS_DENIED',
        resource: req.originalUrl,
        ipAddress: req.ip,
        status: 'FAILURE',
        riskScore: 70,
        details: {
          reason: 'Missing required RBAC permissions',
          userRole,
          missingPermissions: missing,
          url: req.originalUrl,
        },
      });

      return res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission(s): [${missing.join(', ')}]`,
        errorCode: 'INSUFFICIENT_PERMISSIONS',
        missingPermissions: missing,
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
  requirePermission,
};
