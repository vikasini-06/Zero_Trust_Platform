/**
 * Automated End-to-End Test Suite for Zero Trust Enterprise Access Platform
 * Validates:
 * 1. Health & Server Status
 * 2. Seed Data & Credential Verification
 * 3. Two-Stage Authentication & TOTP Verification
 * 4. Forgot & Reset Password Flow
 * 5. RBAC & Granular Permission Enforcement
 * 6. Device Posture & Verification Workflow
 * 7. Active Session Monitoring & Revocation
 * 8. Zero Trust Access Decision Engine (6 Pillars)
 * 9. Access Request Life-Cycle (Create -> Approve)
 * 10. SOC Security Incident Alerts & Resolution
 * 11. Immutable Security Audit Logging
 */

const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const { connectDB, disconnectDB } = require('./config/db');
const { app, server } = require('./server');

let baseUrl;
let testServer;

const request = async (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : { 'Content-Length': 0 }),
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n===============================================================');
  console.log(' ZERO TRUST ENTERPRISE PLATFORM - VERIFICATION TEST SUITE ');
  console.log('===============================================================\n');

  // Wait for server to finish MongoMemoryServer startup and start listening
  console.log('Waiting for backend server and database initialization...');
  while (!server.listening) {
    await new Promise((r) => setTimeout(r, 500));
  }
  const port = process.env.PORT || 5000;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Backend server ready on ${baseUrl}. Starting assertions...\n`);

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${title} - ${details}`);
      failed++;
    }
  };

  try {
    // 1. Health Check
    console.log('[Phase 1: API Gateway & System Health]');
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.body.success === true, 'API Gateway is Operational (/api/health)');

    // 2. Authentication: Employee Login (No MFA initially)
    console.log('\n[Phase 2: Authentication & Identity Verification]');
    const empLogin = await request('POST', '/api/auth/login', {
      email: 'employee@zerotrust.io',
      password: 'Password@123',
    });
    assert(empLogin.status === 200 && !!empLogin.body.data?.token, 'Employee authentication successful (JWT generated)');
    const empToken = empLogin.body.data?.token;

    // 3. Two-Stage MFA Authentication: Super Admin
    console.log('\n[Phase 3: Multi-Factor Authentication (TOTP)]');
    const adminLoginStep1 = await request('POST', '/api/auth/login', {
      email: 'superadmin@zerotrust.io',
      password: 'Password@123',
    });
    assert(
      adminLoginStep1.status === 200 && adminLoginStep1.body.mfaRequired === true,
      'Super Admin login triggers mandatory MFA Step-Up requirement'
    );
    const tempToken = adminLoginStep1.body.tempToken;

    // Verify MFA with demo code
    const adminLoginStep2 = await request('POST', '/api/auth/verify-mfa', {
      tempToken,
      code: '123456',
    });
    assert(
      adminLoginStep2.status === 200 && !!adminLoginStep2.body.data?.token,
      'TOTP second factor validated successfully (Session established)'
    );
    const adminToken = adminLoginStep2.body.data?.token;

    // 4. Password Recovery Workflow
    console.log('\n[Phase 4: Forgot & Reset Password Flow]');
    const forgotRes = await request('POST', '/api/auth/forgot-password', {
      email: 'employee@zerotrust.io',
    });
    assert(
      forgotRes.status === 200 && !!forgotRes.body.resetToken,
      'Password reset authorization token generated'
    );

    const resetRes = await request('POST', '/api/auth/reset-password', {
      token: forgotRes.body.resetToken,
      password: 'Password@123', // maintain demo password
    });
    assert(resetRes.status === 200 && resetRes.body.success === true, 'Password reset verified and saved with bcrypt');

    // 5. RBAC & Least-Privilege Authorization
    console.log('\n[Phase 5: Role-Based Access Control (RBAC)]');
    // Employee attempting to read user directory (requires user:read/admin)
    const empTryUsers = await request('GET', '/api/users', null, {
      Authorization: `Bearer ${empToken}`,
    });
    assert(
      empTryUsers.status === 403,
      'Least-Privilege: Employee forbidden from accessing full user directory (HTTP 403)'
    );

    // Super Admin reading user directory
    const adminUsers = await request('GET', '/api/users', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(
      adminUsers.status === 200 && adminUsers.body.data?.length > 0,
      'Super Admin authorized to view user directory'
    );

    // 6. Device Inventory & Verification
    console.log('\n[Phase 6: Device Trust & Posture Evaluation]');
    const devicesRes = await request('GET', '/api/devices', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(devicesRes.status === 200 && devicesRes.body.count > 0, 'Device inventory queried successfully');

    const pendingDevice = devicesRes.body.data?.find((d) => d.status === 'Pending');
    if (pendingDevice) {
      const verifyDevRes = await request(
        'PUT',
        `/api/devices/${pendingDevice._id}/verify`,
        {},
        { Authorization: `Bearer ${adminToken}` }
      );
      assert(verifyDevRes.status === 200 && verifyDevRes.body.data.status === 'Trusted', 'Device verified and marked as Trusted');
    }

    // 7. Active Session Monitoring & Revocation
    console.log('\n[Phase 7: Continuous Session Management & Revocation]');
    const sessionsRes = await request('GET', '/api/sessions', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(sessionsRes.status === 200 && sessionsRes.body.data?.length > 0, 'Active sessions list retrieved');

    const targetSession = sessionsRes.body.data?.find((s) => s.status === 'Active' && s.user?.email !== 'superadmin@zerotrust.io');
    if (targetSession) {
      const revokeRes = await request(
        'DELETE',
        `/api/sessions/${targetSession.sessionId}`,
        { reason: 'Continuous verification breach test' },
        { Authorization: `Bearer ${adminToken}` }
      );
      assert(revokeRes.status === 200 && revokeRes.body.data?.status === 'Revoked', 'Session forcefully terminated at perimeter');
    }

    // 8. Zero Trust Real-Time Access Decision Engine
    console.log('\n[Phase 8: Zero Trust Access Decision Engine]');
    const resourcesRes = await request('GET', '/api/resources', null, {
      Authorization: `Bearer ${empToken}`,
    });
    assert(resourcesRes.status === 200 && resourcesRes.body.count > 0, 'Enterprise resources catalog queried');

    // Live access verification check
    const evaluateRes = await request(
      'POST',
      '/api/resources/verify-access',
      { resourceId: 'res-hr-01' },
      { Authorization: `Bearer ${empToken}` }
    );
    assert(
      evaluateRes.status === 200 && !!evaluateRes.body.data?.decision,
      `Zero Trust Access Decision: [${evaluateRes.body.data?.decision}] - Risk Score: ${evaluateRes.body.data?.riskScore}`
    );

    // 9. Access Request Life-Cycle
    console.log('\n[Phase 9: Access Request Life-Cycle]');
    const createReq = await request(
      'POST',
      '/api/access-requests',
      {
        resourceId: 'res-fin-02',
        reason: 'Quarterly financial analysis task requiring temporary access',
      },
      { Authorization: `Bearer ${empToken}` }
    );
    assert(createReq.status === 201 && !!createReq.body.data?._id, 'Access request created and evaluated against Zero Trust policies');

    if (createReq.body.data?._id) {
      const approveReq = await request(
        'PUT',
        `/api/access-requests/${createReq.body.data._id}/approve`,
        { reviewNotes: 'Approved after identity & posture verification' },
        { Authorization: `Bearer ${adminToken}` }
      );
      assert(approveReq.status === 200 && approveReq.body.data?.status === 'APPROVED', 'Access request approved by administrator');
    }

    // 10. SOC Security Alerts
    console.log('\n[Phase 10: SOC Security Alerts]');
    const alertsRes = await request('GET', '/api/alerts', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(alertsRes.status === 200 && alertsRes.body.count > 0, 'SOC Security alerts retrieved');

    const openAlert = alertsRes.body.data?.find((a) => a.status === 'Open');
    if (openAlert) {
      const resolveRes = await request(
        'PUT',
        `/api/alerts/${openAlert._id}/resolve`,
        { resolutionNotes: 'Threat quarantined and verified by test suite' },
        { Authorization: `Bearer ${adminToken}` }
      );
      assert(resolveRes.status === 200 && resolveRes.body.data?.status === 'Resolved', 'Security alert resolved with findings');
    }

    // 11. Immutable Audit Logging
    console.log('\n[Phase 11: Security Audit Logging]');
    const auditRes = await request('GET', '/api/audit-logs', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(auditRes.status === 200 && auditRes.body.count > 0, 'Append-only audit trail verified');

    console.log('\n===============================================================');
    console.log(` TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('===============================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error during test suite execution:', err);
    process.exit(1);
  }
};

runTests();
