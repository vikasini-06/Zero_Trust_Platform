const { calculateRiskScore } = require('./riskService');
const { logEvent } = require('./auditService');

/**
 * Zero Trust Access Decision Engine
 * "Never Trust, Always Verify"
 *
 * Evaluates 6 pillars:
 * 1. User Identity & Health (Account status, lockouts)
 * 2. Role-Based Access Control (RBAC Permissions)
 * 3. Device Posture & Trust Status
 * 4. Multi-Factor Authentication State
 * 5. Continuous Session Validity
 * 6. Dynamic Risk Score & Context (Location, Time, Sensitivity)
 */
const evaluateAccess = async ({
  user,
  device = {},
  session = null,
  resource = null,
  requestedPermission = 'resource:read',
  requestContext = {},
}) => {
  // 1. Session Health Check
  if (session && session.status !== 'Active') {
    return {
      allowed: false,
      decision: 'DENY',
      riskScore: 95,
      riskLevel: 'HIGH',
      reason: `Session is invalid or ${session.status.toLowerCase()}`,
      factors: ['Session expired or terminated by security policy'],
    };
  }

  // 2. User Account Posture Check
  if (user.status !== 'Active' || user.isLocked) {
    return {
      allowed: false,
      decision: 'DENY',
      riskScore: 90,
      riskLevel: 'HIGH',
      reason: 'User account is locked or suspended due to security violations',
      factors: ['Account flagged in identity directory'],
    };
  }

  // 3. Device Posture Evaluation
  if (device.status === 'Blocked') {
    return {
      allowed: false,
      decision: 'DENY',
      riskScore: 100,
      riskLevel: 'HIGH',
      reason: 'Access blocked: Hardware/Device is explicitly blacklisted',
      factors: ['Blacklisted endpoint attempting network access'],
    };
  }

  // 4. Calculate Dynamic Risk Score
  const riskEvaluation = calculateRiskScore({
    user,
    device,
    resource,
    failedAttempts: user.failedLoginAttempts,
    isMfaVerified: !!session?.isMfaVerified || user.mfaEnabled,
    ipAddress: requestContext.ipAddress,
    location: requestContext.location,
  });

  const { riskScore, riskLevel, factors } = riskEvaluation;

  // 5. High Risk Policy Interception
  if (riskScore >= 75) {
    return {
      allowed: false,
      decision: 'SUSPICIOUS',
      riskScore,
      riskLevel: 'HIGH',
      reason: 'Access halted: Anomaly detection triggered excessive risk score (>75)',
      factors,
    };
  }

  // 6. Device Verification Step-up Requirement
  if (device.status === 'Pending' && (resource?.minTrustLevel === 'HIGH' || resource?.classification === 'RESTRICTED')) {
    return {
      allowed: false,
      decision: 'REQUIRE_DEVICE_VERIFICATION',
      riskScore,
      riskLevel,
      reason: 'Access requires verified device posture. Current device status is Pending approval.',
      factors: [...factors, 'Target resource requires hardware verification'],
    };
  }

  // 7. Step-Up MFA Requirement
  const resourceRequiresMfa = resource?.requiresMFA || resource?.classification === 'CONFIDENTIAL' || resource?.classification === 'RESTRICTED';
  if (resourceRequiresMfa && !user.mfaEnabled) {
    return {
      allowed: false,
      decision: 'REQUIRE_MFA',
      riskScore,
      riskLevel,
      reason: 'Step-up Multi-Factor Authentication (TOTP) is required for sensitive resource',
      factors: [...factors, 'Target resource enforces second factor authentication'],
    };
  }

  // 8. Role-Based Access Control (RBAC) Check
  if (resource) {
    const userRoleName = user.roleName || user.role?.name;
    const isRolePermitted = !resource.requiredRole || resource.requiredRole.length === 0 || resource.requiredRole.includes(userRoleName);

    if (!isRolePermitted) {
      return {
        allowed: false,
        decision: 'DENY',
        riskScore: Math.max(riskScore, 65),
        riskLevel: 'MEDIUM',
        reason: `Insufficient role standing. Required roles: ${resource.requiredRole.join(', ')}`,
        factors: [...factors, 'RBAC check failed for target resource'],
      };
    }
  }

  // 9. All Zero Trust Pillars Passed: ALLOW
  const reason = device.status === 'Trusted' && user.mfaEnabled
    ? 'Zero Trust policy satisfied: Verified identity + Trusted device + Active MFA'
    : 'Baseline Zero Trust policy approved with acceptable risk score';

  return {
    allowed: true,
    decision: 'ALLOW',
    riskScore,
    riskLevel,
    reason,
    factors,
  };
};

module.exports = {
  evaluateAccess,
};
