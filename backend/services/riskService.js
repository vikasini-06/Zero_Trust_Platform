/**
 * Zero Trust Dynamic Explainable Risk Scoring Engine
 * Evaluates contextual indicators to produce an explainable risk score (0-100).
 */

const calculateRiskScore = ({
  user = {},
  device = {},
  resource = null,
  failedAttempts = 0,
  isMfaVerified = false,
  ipAddress = '127.0.0.1',
  location = 'Corporate HQ',
}) => {
  let score = 10; // Baseline baseline trust penalty in Zero Trust ("Never trust by default")
  const factors = [];

  // 1. Device Posture Evaluation
  if (device.status === 'Blocked') {
    score += 90;
    factors.push('Device is explicitly BLOCKED in enterprise inventory (+90)');
  } else if (device.status === 'Suspicious') {
    score += 45;
    factors.push('Device has suspicious posture history (+45)');
  } else if (device.status === 'Pending') {
    score += 25;
    factors.push('Unverified/New device pending security team approval (+25)');
  } else if (device.status === 'Trusted') {
    score -= 5;
    factors.push('Device is verified and marked as Trusted (-5)');
  }

  // 2. Multi-Factor Authentication (MFA)
  if (user.mfaEnabled && isMfaVerified) {
    score -= 10;
    factors.push('Valid TOTP Multi-Factor Authentication completed (-10)');
  } else if (!user.mfaEnabled) {
    score += 20;
    factors.push('Account lacks Multi-Factor Authentication protection (+20)');
  } else if (user.mfaEnabled && !isMfaVerified) {
    score += 30;
    factors.push('MFA enabled but second factor challenge not yet verified (+30)');
  }

  // 3. Authentication Anomalies & Failed Attempts
  const attempts = failedAttempts || user.failedLoginAttempts || 0;
  if (attempts >= 3) {
    score += 40;
    factors.push(`Multiple consecutive failed authentication attempts (${attempts}) (+40)`);
  } else if (attempts > 0) {
    score += attempts * 15;
    factors.push(`${attempts} recent failed authentication attempt(s) (+${attempts * 15})`);
  }

  // 4. Temporal / Off-hours Context
  const currentHour = new Date().getHours();
  if (currentHour >= 23 || currentHour <= 5) {
    score += 15;
    factors.push('Access requested during off-peak hours (11 PM - 5 AM) (+15)');
  }

  // 5. Resource Sensitivity Classification
  if (resource) {
    if (resource.classification === 'RESTRICTED') {
      score += 25;
      factors.push('Target resource classified as RESTRICTED (+25)');
    } else if (resource.classification === 'CONFIDENTIAL') {
      score += 15;
      factors.push('Target resource classified as CONFIDENTIAL (+15)');
    }
  }

  // Clamp score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  let riskLevel = 'LOW';
  if (finalScore >= 71) {
    riskLevel = 'HIGH';
  } else if (finalScore >= 31) {
    riskLevel = 'MEDIUM';
  }

  return {
    riskScore: finalScore,
    riskLevel,
    factors,
  };
};

module.exports = {
  calculateRiskScore,
};
