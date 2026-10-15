const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { connectDB, disconnectDB } = require('../config/db');
const Role = require('../models/Role');
const User = require('../models/User');
const Device = require('../models/Device');
const Session = require('../models/Session');
const Resource = require('../models/Resource');
const AccessRequest = require('../models/AccessRequest');
const SecurityAlert = require('../models/SecurityAlert');
const AuditLog = require('../models/AuditLog');

const ALL_PERMISSIONS = [
  'user:read',
  'user:create',
  'user:update',
  'user:delete',
  'role:read',
  'role:update',
  'device:read',
  'device:verify',
  'session:read',
  'session:revoke',
  'audit:read',
  'alert:read',
  'alert:resolve',
  'resource:read',
  'resource:request',
  'resource:approve',
  'policy:manage',
];

const seedData = async (shouldDisconnect = false) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    console.log('[Seed] Seeding database with Zero Trust enterprise baseline data...');

    await Promise.all([
      Role.deleteMany({}),
      User.deleteMany({}),
      Device.deleteMany({}),
      Session.deleteMany({}),
      Resource.deleteMany({}),
      AccessRequest.deleteMany({}),
      SecurityAlert.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('[Seed] 1. Creating Roles with Granular RBAC Permissions...');
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Full enterprise standing privileges and security policy authority',
      permissions: ALL_PERMISSIONS,
      level: 4,
      isSystemRole: true,
    });

    const securityAdminRole = await Role.create({
      name: 'Security Admin',
      description: 'SOC operations, threat monitoring, session revocation, device verification',
      permissions: [
        'user:read',
        'device:read',
        'device:verify',
        'session:read',
        'session:revoke',
        'audit:read',
        'alert:read',
        'alert:resolve',
        'resource:read',
        'resource:approve',
      ],
      level: 3,
      isSystemRole: true,
    });

    const managerRole = await Role.create({
      name: 'Manager',
      description: 'Team lead authorized to review team access requests and evaluate risk',
      permissions: [
        'user:read',
        'resource:read',
        'resource:approve',
        'resource:request',
        'session:read',
        'device:read',
      ],
      level: 2,
      isSystemRole: true,
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Standard enterprise workforce user bound by least-privilege Zero Trust policy',
      permissions: ['resource:read', 'resource:request', 'session:read', 'device:read'],
      level: 1,
      isSystemRole: true,
    });

    console.log('[Seed] 2. Creating Demo Enterprise Users...');
    const superAdmin = await User.create({
      name: 'Alex Vance (Super Admin)',
      email: 'superadmin@zerotrust.io',
      password: 'Password@123',
      role: superAdminRole._id,
      roleName: superAdminRole.name,
      department: 'Global Information Security',
      title: 'Chief Information Security Officer (CISO)',
      status: 'Active',
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      lastLogin: new Date(),
    });

    const securityAdmin = await User.create({
      name: 'Elena Rostova (Security Admin)',
      email: 'securityadmin@zerotrust.io',
      password: 'Password@123',
      role: securityAdminRole._id,
      roleName: securityAdminRole.name,
      department: 'Security Operations Center (SOC)',
      title: 'Lead SOC Threat Analyst',
      status: 'Active',
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      lastLogin: new Date(Date.now() - 30 * 60 * 1000),
    });

    const manager = await User.create({
      name: 'Marcus Brody (Manager)',
      email: 'manager@zerotrust.io',
      password: 'Password@123',
      role: managerRole._id,
      roleName: managerRole.name,
      department: 'Engineering Leadership',
      title: 'Engineering Director',
      status: 'Active',
      mfaEnabled: false,
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });

    const employee = await User.create({
      name: 'Jordan Hayes (Employee)',
      email: 'employee@zerotrust.io',
      password: 'Password@123',
      role: employeeRole._id,
      roleName: employeeRole.name,
      department: 'Software Engineering',
      title: 'Frontend Developer',
      status: 'Active',
      mfaEnabled: false,
      lastLogin: new Date(Date.now() - 5 * 60 * 1000),
    });

    console.log('[Seed] 3. Creating Protected Enterprise Resources...');
    const resources = await Resource.insertMany([
      {
        resourceId: 'res-hr-01',
        name: 'Enterprise HR Portal',
        category: 'Human Resources',
        description: 'Internal employee records, benefits management, and payroll records',
        classification: 'INTERNAL',
        requiredRole: ['Employee', 'Manager', 'Security Admin', 'Super Admin'],
        requiredPermission: 'resource:read',
        minTrustLevel: 'LOW',
        requiresMFA: false,
        endpointUrl: 'https://hr.enterprise.internal',
        icon: 'Users',
        activeUsersCount: 142,
      },
      {
        resourceId: 'res-fin-02',
        name: 'Finance & Treasury Dashboard',
        category: 'Financial Operations',
        description: 'Corporate bank ledgers, quarterly revenues, tax reports, and wire authorizations',
        classification: 'RESTRICTED',
        requiredRole: ['Manager', 'Super Admin'],
        requiredPermission: 'resource:read',
        minTrustLevel: 'HIGH',
        requiresMFA: true,
        endpointUrl: 'https://treasury.enterprise.internal',
        icon: 'DollarSign',
        activeUsersCount: 18,
      },
      {
        resourceId: 'res-crm-03',
        name: 'Customer Global Database',
        category: 'Data Warehouse',
        description: 'Customer PII, CRM records, contracts, and enterprise sales leads',
        classification: 'CONFIDENTIAL',
        requiredRole: ['Manager', 'Security Admin', 'Super Admin'],
        requiredPermission: 'resource:read',
        minTrustLevel: 'MEDIUM',
        requiresMFA: true,
        endpointUrl: 'https://crm.enterprise.internal',
        icon: 'Database',
        activeUsersCount: 65,
      },
      {
        resourceId: 'res-pm-04',
        name: 'Project Jira & Management Hub',
        category: 'Operations',
        description: 'Sprint planning boards, architectural roadmaps, and bug trackers',
        classification: 'INTERNAL',
        requiredRole: ['Employee', 'Manager', 'Security Admin', 'Super Admin'],
        requiredPermission: 'resource:read',
        minTrustLevel: 'LOW',
        requiresMFA: false,
        endpointUrl: 'https://jira.enterprise.internal',
        icon: 'Kanban',
        activeUsersCount: 310,
      },
      {
        resourceId: 'res-rep-05',
        name: 'Executive Intelligence Reports',
        category: 'Business Intelligence',
        description: 'High-level business performance metrics, forecasting, and compliance filings',
        classification: 'INTERNAL',
        requiredRole: ['Manager', 'Security Admin', 'Super Admin'],
        requiredPermission: 'resource:read',
        minTrustLevel: 'LOW',
        requiresMFA: false,
        endpointUrl: 'https://bi.enterprise.internal',
        icon: 'BarChart2',
        activeUsersCount: 42,
      },
      {
        resourceId: 'res-git-06',
        name: 'Core Production Git Repository',
        category: 'Engineering',
        description: 'Source code repositories, deployment pipelines, CI/CD credentials, and secret stores',
        classification: 'RESTRICTED',
        requiredRole: ['Employee', 'Manager', 'Security Admin', 'Super Admin'],
        requiredPermission: 'resource:read',
        minTrustLevel: 'HIGH',
        requiresMFA: true,
        endpointUrl: 'https://git.enterprise.internal',
        icon: 'GitBranch',
        activeUsersCount: 88,
      },
    ]);

    console.log('[Seed] 4. Creating Devices...');
    const superAdminDevice = await Device.create({
      user: superAdmin._id,
      deviceId: 'dev_sec_ciso_9921',
      deviceName: 'CISO Corporate Workstation',
      browser: 'Chrome 128',
      os: 'Windows 11 Enterprise',
      deviceType: 'Desktop',
      ipAddress: '192.168.1.10',
      location: 'Washington DC, US',
      status: 'Trusted',
      riskScore: 5,
      verifiedBy: superAdmin._id,
      verifiedAt: new Date(),
    });

    const securityAdminDevice = await Device.create({
      user: securityAdmin._id,
      deviceId: 'dev_soc_analyst_4412',
      deviceName: 'SOC MacBook Pro M3',
      browser: 'Safari 18',
      os: 'macOS Sonoma',
      deviceType: 'Laptop',
      ipAddress: '192.168.1.15',
      location: 'New York HQ, US',
      status: 'Trusted',
      riskScore: 10,
      verifiedBy: superAdmin._id,
      verifiedAt: new Date(),
    });

    const managerDevice = await Device.create({
      user: manager._id,
      deviceId: 'dev_mgr_surface_8831',
      deviceName: 'Surface Laptop Studio',
      browser: 'Edge 128',
      os: 'Windows 11 Pro',
      deviceType: 'Laptop',
      ipAddress: '192.168.1.44',
      location: 'Austin, US',
      status: 'Trusted',
      riskScore: 15,
      verifiedBy: securityAdmin._id,
      verifiedAt: new Date(),
    });

    const employeeDevice = await Device.create({
      user: employee._id,
      deviceId: 'dev_emp_thinkpad_2210',
      deviceName: 'ThinkPad T14 Workstation',
      browser: 'Chrome 128',
      os: 'Windows 11',
      deviceType: 'Laptop',
      ipAddress: '192.168.1.88',
      location: 'San Jose, US',
      status: 'Trusted',
      riskScore: 15,
      verifiedBy: securityAdmin._id,
      verifiedAt: new Date(),
    });

    const pendingDevice = await Device.create({
      user: employee._id,
      deviceId: 'dev_emp_mobile_3321',
      deviceName: 'Pixel 9 Personal Phone',
      browser: 'Chrome Mobile',
      os: 'Android 15',
      deviceType: 'Mobile',
      ipAddress: '10.0.4.112',
      location: 'San Jose, US',
      status: 'Pending',
      riskScore: 35,
    });

    const blockedDevice = await Device.create({
      user: employee._id,
      deviceId: 'dev_blacklisted_anon_09',
      deviceName: 'Unrecognized Tor Virtual Node',
      browser: 'Tor / Firefox',
      os: 'Linux Unknown',
      deviceType: 'Desktop',
      ipAddress: '185.220.101.5',
      location: 'Frankfurt, DE (Tor Exit Node)',
      status: 'Blocked',
      riskScore: 100,
      blockedReason: 'Known malicious exit node attempting perimeter penetration',
    });

    console.log('[Seed] 5. Creating Active Enterprise Sessions...');
    const now = new Date();
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const activeSessions = await Session.insertMany([
      {
        sessionId: 'ses_live_ciso_9901',
        user: superAdmin._id,
        device: superAdminDevice._id,
        deviceId: superAdminDevice.deviceId,
        ipAddress: superAdminDevice.ipAddress,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0',
        location: 'Washington DC, US',
        loginTime: new Date(now.getTime() - 25 * 60 * 1000),
        lastActivity: now,
        expiryTime: expiry,
        status: 'Active',
        riskScore: 10,
        riskFactors: ['Trusted hardware verified', 'Hardware-backed MFA verified'],
      },
      {
        sessionId: 'ses_live_soc_8802',
        user: securityAdmin._id,
        device: securityAdminDevice._id,
        deviceId: securityAdminDevice.deviceId,
        ipAddress: securityAdminDevice.ipAddress,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/18.0',
        location: 'New York HQ, US',
        loginTime: new Date(now.getTime() - 45 * 60 * 1000),
        lastActivity: new Date(now.getTime() - 2 * 60 * 1000),
        expiryTime: expiry,
        status: 'Active',
        riskScore: 12,
        riskFactors: ['SOC Trusted device verified'],
      },
      {
        sessionId: 'ses_live_mgr_7703',
        user: manager._id,
        device: managerDevice._id,
        deviceId: managerDevice.deviceId,
        ipAddress: managerDevice.ipAddress,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/128.0.0.0',
        location: 'Austin, US',
        loginTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        lastActivity: new Date(now.getTime() - 15 * 60 * 1000),
        expiryTime: expiry,
        status: 'Active',
        riskScore: 25,
        riskFactors: ['MFA not enabled on manager account (+20)'],
      },
      {
        sessionId: 'ses_live_emp_6604',
        user: employee._id,
        device: employeeDevice._id,
        deviceId: employeeDevice.deviceId,
        ipAddress: employeeDevice.ipAddress,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0',
        location: 'San Jose, US',
        loginTime: new Date(now.getTime() - 10 * 60 * 1000),
        lastActivity: now,
        expiryTime: expiry,
        status: 'Active',
        riskScore: 20,
        riskFactors: ['Standard workstation trust level'],
      },
      {
        sessionId: 'ses_suspicious_5505',
        user: employee._id,
        device: blockedDevice._id,
        deviceId: blockedDevice.deviceId,
        ipAddress: blockedDevice.ipAddress,
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
        location: 'Frankfurt, DE (Tor Exit Node)',
        loginTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        lastActivity: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        expiryTime: expiry,
        status: 'Revoked',
        riskScore: 98,
        riskFactors: ['Anomalous geofence', 'Tor exit node identified', 'Device blacklisted'],
        revokedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        revokedBy: securityAdmin._id,
        revokedReason: 'Automated Zero Trust boundary severance: Blocked endpoint detected',
      },
    ]);

    console.log('[Seed] 6. Creating Security Alerts...');
    await SecurityAlert.insertMany([
      {
        alertId: 'ALT-2026-0001',
        type: 'BLOCKED_DEVICE_ACCESS_ATTEMPT',
        severity: 'CRITICAL',
        user: employee._id,
        userName: employee.name,
        userEmail: employee.email,
        device: blockedDevice._id,
        deviceId: blockedDevice.deviceId,
        ipAddress: blockedDevice.ipAddress,
        description: 'Blocked device [dev_blacklisted_anon_09] attempted authentication via Tor exit node in Frankfurt.',
        status: 'Open',
        riskScore: 98,
        mitigationAction: 'Access severed at perimeter. Session forcefully revoked.',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        alertId: 'ALT-2026-0002',
        type: 'NEW_DEVICE_DETECTED',
        severity: 'MEDIUM',
        user: employee._id,
        userName: employee.name,
        userEmail: employee.email,
        device: pendingDevice._id,
        deviceId: pendingDevice.deviceId,
        ipAddress: pendingDevice.ipAddress,
        description: 'New mobile device [Pixel 9 Personal Phone] registered and placed in Pending approval queue.',
        status: 'Open',
        riskScore: 35,
        mitigationAction: 'Awaiting SOC administrator device trust review.',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
      {
        alertId: 'ALT-2026-0003',
        type: 'BRUTE_FORCE_ATTEMPT',
        severity: 'HIGH',
        userName: 'Anonymous / Target: manager@zerotrust.io',
        userEmail: 'manager@zerotrust.io',
        ipAddress: '194.26.29.11',
        description: '4 consecutive invalid password submissions detected within 60 seconds against manager account.',
        status: 'Investigating',
        riskScore: 78,
        mitigationAction: 'Rate limiter activated on ingress gateway. IP address placed under behavioral surveillance.',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      },
      {
        alertId: 'ALT-2026-0004',
        type: 'RESTRICTED_RESOURCE_POLICY_BREACH',
        severity: 'HIGH',
        user: employee._id,
        userName: employee.name,
        userEmail: employee.email,
        deviceId: employeeDevice.deviceId,
        ipAddress: employeeDevice.ipAddress,
        description: 'Direct unauthorized access request to Finance & Treasury Dashboard blocked by Zero Trust RBAC.',
        status: 'Resolved',
        resolvedBy: securityAdmin._id,
        resolvedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        resolutionNotes: 'Employee explained accidental link click from internal email. Educated employee on access procedure.',
        riskScore: 65,
        mitigationAction: 'Access prevented by evaluateAccess checkpoint.',
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      },
    ]);

    console.log('[Seed] 7. Creating Access Requests...');
    await AccessRequest.insertMany([
      {
        requester: employee._id,
        requesterName: employee.name,
        requesterEmail: employee.email,
        requesterRole: employee.roleName,
        resourceId: 'res-git-06',
        resourceName: 'Core Production Git Repository',
        resourceCategory: 'Engineering',
        reason: 'Assigned to sprint story #844: Payment gateway webhook refactor. Requires commit access.',
        requestedPermission: 'WRITE',
        status: 'PENDING',
        riskScore: 25,
        riskLevel: 'LOW',
        riskFactors: ['Trusted workstation', 'Standard sprint task'],
        zeroTrustDecision: {
          decision: 'ALLOW',
          reason: 'Trusted device + valid role baseline. Pending manager authorization signoff.',
          score: 25,
        },
        requestedAt: new Date(now.getTime() - 35 * 60 * 1000),
      },
      {
        requester: employee._id,
        requesterName: employee.name,
        requesterEmail: employee.email,
        requesterRole: employee.roleName,
        resourceId: 'res-fin-02',
        resourceName: 'Finance & Treasury Dashboard',
        resourceCategory: 'Financial Operations',
        reason: 'Need access to inspect billing discrepancies for developer tooling invoices.',
        requestedPermission: 'READ',
        status: 'REJECTED',
        riskScore: 65,
        riskLevel: 'MEDIUM',
        riskFactors: ['Resource requires RESTRICTED clearance', 'Target requires MFA'],
        zeroTrustDecision: {
          decision: 'DENY',
          reason: 'Least privilege policy violation. Role Employee not authorized for Treasury ledgers.',
          score: 65,
        },
        requestedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        reviewedBy: manager._id,
        reviewedByName: manager.name,
        reviewedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        reviewNotes: 'Invoice discrepancies must be routed through the Finance team directly. Request rejected.',
      },
      {
        requester: manager._id,
        requesterName: manager.name,
        requesterEmail: manager.email,
        requesterRole: manager.roleName,
        resourceId: 'res-crm-03',
        resourceName: 'Customer Global Database',
        resourceCategory: 'Data Warehouse',
        reason: 'Quarterly executive churn analysis and customer tier alignment audit.',
        requestedPermission: 'READ',
        status: 'APPROVED',
        riskScore: 20,
        riskLevel: 'LOW',
        riskFactors: ['Managerial role authorized', 'Verified workstation'],
        zeroTrustDecision: {
          decision: 'ALLOW',
          reason: 'Authorized role and acceptable risk posture.',
          score: 20,
        },
        requestedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        reviewedBy: superAdmin._id,
        reviewedByName: superAdmin.name,
        reviewedAt: new Date(now.getTime() - 22 * 60 * 60 * 1000),
        reviewNotes: 'Granted read-only access for Q3 reporting period.',
      },
    ]);

    console.log('[Seed] 8. Creating Audit Logs...');
    const auditLogs = [
      {
        userId: superAdmin._id,
        userName: superAdmin.name,
        userEmail: superAdmin.email,
        action: 'LOGIN_SUCCESS',
        resource: 'Authentication',
        ipAddress: '192.168.1.10',
        deviceId: superAdminDevice.deviceId,
        status: 'SUCCESS',
        riskScore: 5,
        details: { method: 'Password + TOTP MFA', device: superAdminDevice.deviceName },
        timestamp: new Date(now.getTime() - 25 * 60 * 1000),
      },
      {
        userId: securityAdmin._id,
        userName: securityAdmin.name,
        userEmail: securityAdmin.email,
        action: 'DEVICE_VERIFIED',
        resource: 'Device',
        resourceId: managerDevice.deviceId,
        ipAddress: '192.168.1.15',
        deviceId: securityAdminDevice.deviceId,
        status: 'SUCCESS',
        riskScore: 10,
        details: { targetDevice: managerDevice.deviceName, owner: manager.email },
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
      {
        userId: employee._id,
        userName: employee.name,
        userEmail: employee.email,
        action: 'ACCESS_REQUEST_CREATED',
        resource: 'Core Production Git Repository',
        resourceId: 'res-git-06',
        ipAddress: employeeDevice.ipAddress,
        deviceId: employeeDevice.deviceId,
        status: 'SUCCESS',
        riskScore: 25,
        details: { reason: 'Sprint task #844 write access' },
        timestamp: new Date(now.getTime() - 35 * 60 * 1000),
      },
      {
        userId: employee._id,
        userName: employee.name,
        userEmail: employee.email,
        action: 'ACCESS_DENIED',
        resource: 'Finance & Treasury Dashboard',
        resourceId: 'res-fin-02',
        ipAddress: employeeDevice.ipAddress,
        deviceId: employeeDevice.deviceId,
        status: 'BLOCKED',
        riskScore: 65,
        details: { reason: 'Insufficient role standing and missing step-up MFA' },
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      },
      {
        userId: employee._id,
        userName: employee.name,
        userEmail: employee.email,
        action: 'SESSION_REVOKED',
        resource: 'Session',
        resourceId: 'ses_suspicious_5505',
        ipAddress: blockedDevice.ipAddress,
        deviceId: blockedDevice.deviceId,
        status: 'SUCCESS',
        riskScore: 98,
        details: { reason: 'Automated Zero Trust boundary severance: Blocked endpoint detected' },
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        userName: 'Anonymous Intruder',
        userEmail: 'manager@zerotrust.io',
        action: 'LOGIN_FAILED',
        resource: 'Authentication',
        ipAddress: '194.26.29.11',
        deviceId: 'dev_unknown_unregistered',
        status: 'FAILURE',
        riskScore: 80,
        details: { reason: 'Repeated bad password attempts from unassigned IP' },
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      },
    ];

    await AuditLog.insertMany(auditLogs);

    console.log('[Seed] Database successfully populated with realistic Zero Trust enterprise data!');
    console.log('\n================ DEMO ACCOUNTS CREATED ================');
    console.log('1. Super Admin   : superadmin@zerotrust.io   | Password@123');
    console.log('2. Security Admin: securityadmin@zerotrust.io| Password@123');
    console.log('3. Manager       : manager@zerotrust.io      | Password@123');
    console.log('4. Employee      : employee@zerotrust.io     | Password@123');
    console.log('========================================================\n');

    if (shouldDisconnect) {
      await disconnectDB();
    }
    return true;
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
    throw err;
  }
};

if (require.main === module) {
  seedData(true)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedData };

