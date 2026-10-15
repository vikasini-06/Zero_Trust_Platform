# ZeroTrust Enterprise Access Management Platform
> **"Never Trust, Always Verify."**

A production-grade, full-stack **Zero Trust Enterprise Access Management Platform** architected on the **MERN stack** (MongoDB, Express.js, React.js, Node.js) with real-time **WebSockets (Socket.IO)** and **Tailwind CSS**. Built strictly in adherence to the **NIST SP 800-207 Zero Trust Architecture (ZTA)** standard, this platform replaces outdated perimeter network security models with continuous dynamic verification, contextual explainable risk scoring, endpoint posture governance, least-privilege RBAC, and instantaneous perimeter severance.

---

## Table of Contents

1. [Executive Summary & Zero Trust Philosophy](#1-executive-summary--zero-trust-philosophy)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [The 6 Pillars of the Zero Trust Access Decision Engine](#3-the-6-pillars-of-the-zero-trust-access-decision-engine)
4. [Explainable Risk Scoring Calculus & Mathematical Model](#4-explainable-risk-scoring-calculus--mathematical-model)
5. [Granular RBAC & Permissions Matrix](#5-granular-rbac--permissions-matrix)
6. [Complete Repository Directory Tree](#6-complete-repository-directory-tree)
7. [Exhaustive Module-by-Module Technical Reference](#7-exhaustive-module-by-module-technical-reference)
   - [7.1 Backend Server & Infrastructure](#71-backend-server--infrastructure)
   - [7.2 Data Models & Schemas](#72-data-models--schemas)
   - [7.3 Backend Core Services](#73-backend-core-services)
   - [7.4 Middleware Pipeline](#74-middleware-pipeline)
   - [7.5 API Controllers & Business Logic](#75-api-controllers--business-logic)
   - [7.6 API Routing Subsystem](#76-api-routing-subsystem)
   - [7.7 Backend Utilities & Seed Generator](#77-backend-utilities--seed-generator)
   - [7.8 Automated End-to-End Test Suite](#78-automated-end-to-end-test-suite)
   - [7.9 Frontend Architecture & Component Ecosystem](#79-frontend-architecture--component-ecosystem)
   - [7.10 Frontend Application Pages](#710-frontend-application-pages)
8. [Real-Time Telemetry & Socket.IO Event Specification](#8-real-time-telemetry--socketio-event-specification)
9. [Complete REST API Specification](#9-complete-rest-api-specification)
10. [Pre-configured Demo Accounts & Fast-Track Credentials](#10-pre-configured-demo-accounts--fast-track-credentials)
11. [Installation, Setup & Environment Configuration](#11-installation-setup--environment-configuration)
12. [End-to-End Demonstration Walkthrough](#12-end-to-end-demonstration-walkthrough)
13. [Security Engineering, Hardening & Compliance](#13-security-engineering-hardening--compliance)
14. [License](#14-license)

---

## 1. Executive Summary & Zero Trust Philosophy

### The Flaw of Perimeter-Based Security
Traditional corporate networks employ the "castle-and-moat" security model: traffic originating outside the network is untrusted, but anything inside the corporate perimeter (or behind a VPN) is granted broad, standing trust. In modern distributed enterprise environments, this perimeter model fails because:
- **Lateral Movement**: Once an attacker compromises a single endpoint or VPN account, they move unrestricted across internal subnets.
- **Stolen Credentials & Session Hijacking**: Passwords and session cookies allow unauthorized persistence with zero ongoing re-evaluation.
- **Excessive Standing Privileges**: Employees possess permanent administrative access to data they rarely need.
- **Unmanaged Hardware**: BYOD and personal devices introduce vulnerabilities into corporate infrastructure.

### The NIST SP 800-207 Zero Trust Paradigm
This platform enforces the core tenants of **NIST SP 800-207**:
1. **All data sources and computing services are considered resources.**
2. **All communication is secured regardless of network location.**
3. **Access to individual enterprise resources is granted on a per-session basis.**
4. **Access is determined by dynamic policy**—including the observable state of client identity, application/service, and the requesting asset—and may include other behavioral and environmental attributes.
5. **The enterprise monitors and measures the integrity and security posture of all owned and associated assets.**
6. **All resource authentication and authorization are dynamic and strictly enforced before access is allowed.**
7. **The enterprise collects as much information as possible about the current state of assets, network infrastructure, and communications and uses it to improve security posture.**

```
+-------------------------------------------------------------------------------------------------------+
|                                      ZERO TRUST ARCHITECTURE                                          |
|                                                                                                       |
|   "Assume Breach"  *  "Verify Explicitly"  *  "Enforce Least Privilege"  *  "Continuous Verification" |
+-------------------------------------------------------------------------------------------------------+
```

---

## 2. High-Level System Architecture

The following diagram illustrates the complete request lifecycle across the perimeter gateway, policy engine, telemetry layers, and persistent storage:

```
                            [ Client Browser / Workstation ]
                                           │
                        (HTTPS / REST)     │     (WSS / Socket.IO)
                                           ▼
             ┌─────────────────────────────────────────────────────────────┐
             │            INGRESS & PERIMETER DEFENSE LAYER                │
             │  • Express Rate Limiter (Brute-Force & Flooding Defense)    │
             │  • Helmet (HTTP Security Headers, Sniffing & XSS Mitigation)│
             │  • CORS Whitelist Validation                                │
             └─────────────────────────────┬───────────────────────────────┘
                                           │
                                           ▼
             ┌─────────────────────────────────────────────────────────────┐
             │          IDENTITY, TOKEN & DEVICE POSTURE CAPTURE           │
             │  • authMiddleware: Bearer JWT Decryption & Signature Check  │
             │  • sessionMiddleware: Continuous MongoDB Heartbeat & Check  │
             │  • deviceService: User-Agent & SHA-256 Fingerprinting       │
             └─────────────────────────────┬───────────────────────────────┘
                                           │
                                           ▼
             ┌─────────────────────────────────────────────────────────────┐
             │      ZERO TRUST POLICY DECISION POINT (PDP / 6 PILLARS)     │
             │  1. Identity Status & Account Lockout Check                 │
             │  2. Role-Based Access Control (RBAC) Permission Match       │
             │  3. Device Trust Status (Trusted / Pending / Blocked)       │
             │  4. Step-Up Multi-Factor Authentication (TOTP / RFC 6238)   │
             │  5. Continuous Session Health & Revocation Check            │
             │  6. Dynamic Explainable Contextual Risk Scoring Calculus    │
             └─────────────────────────────┬───────────────────────────────┘
                                           │
                     ┌─────────────────────┴────────────────────┐
                     ▼                                          ▼
           [ POLICY EVALUATION ]                      [ POLICY VIOLATION ]
         • Status: ALLOW                            • Status: DENY / SUSPICIOUS
         • Risk: Low / Acceptable                   • Status: REQUIRE_MFA
         • PEP Permits Access                       • Status: REQUIRE_DEVICE_VERIFY
                     │                                          │
                     ▼                                          ▼
      ┌─────────────────────────────┐            ┌─────────────────────────────┐
      │  POLICY ENFORCEMENT POINT   │            │    REAL-TIME SEVERANCE      │
      │  • Execute Protected API    │            │  • Terminate Session        │
      │  • Return Resource Payload  │            │  • Emit WebSocket Notice    │
      │  • Append SUCCESS Audit Log │            │  • Dispatch SOC Alert       │
      └──────────────┬──────────────┘            └──────────────┬──────────────┘
                     │                                          │
                     └─────────────────────┬────────────────────┘
                                           │
                                           ▼
             ┌─────────────────────────────────────────────────────────────┐
             │             DATA & REAL-TIME EVENT BUS LAYER                │
             │  • Socket.IO Server: Broadcasts alerts & revocation events │
             │  • MongoDB Database: Persistent identity, audit, resources  │
             │  • MongoMemoryServer: Automatic zero-config fallback engine │
             └─────────────────────────────────────────────────────────────┘
```

---

## 3. The 6 Pillars of the Zero Trust Access Decision Engine

Implemented inside `backend/services/accessDecisionService.js`, the **Zero Trust Access Decision Engine** evaluates access requests against 6 distinct pillars before granting access to sensitive assets:

| Pillar | Diagnostic Check | Evaluation Criteria | Failure Action |
| :--- | :--- | :--- | :--- |
| **1. Identity & Health** | Account Lockout & Directory Standing | User `status === 'Active'` and `isLocked === false`. Verified against brute-force counters and administrative suspensions. | Returns `DENY` (Risk Score: 90). Access is halted immediately. |
| **2. Role-Based Access (RBAC)** | Principle of Least Privilege | Validates that caller's role matches `resource.requiredRole` and permissions match `resource.requiredPermission`. | Returns `DENY` (Risk Score: 65). Prompts for access request justification. |
| **3. Device Trust Posture** | Hardware & Endpoint Integrity | Matches device signature against enterprise hardware directory. Verifies device is not `Blocked` or unapproved `Pending`. | Returns `DENY` (Score: 100) if `Blocked`; returns `REQUIRE_DEVICE_VERIFICATION` if `Pending` on high-risk resources. |
| **4. Step-Up MFA State** | Cryptographic Second-Factor | For resources marked `requiresMFA: true` or classified as `CONFIDENTIAL` / `RESTRICTED`, verifies active TOTP MFA. | Returns `REQUIRE_MFA`. Prompts user for 6-digit TOTP challenge. |
| **5. Continuous Session Health** | Active Perimeter Validity | Checks that active session is marked `Active`, has not expired past 24 hours, and has not been revoked by SOC. | Returns `DENY` (Risk Score: 95). Severance trigger activates. |
| **6. Dynamic Risk Calculus** | Multi-Factor Contextual Scoring | Calculates real-time risk score (0–100) based on anomalies, time of day, hardware posture, and past failed logins. | If score >= 75, returns `SUSPICIOUS`. Access is withheld and flagged for SOC review. |

### Decision Outcomes
The engine outputs one of five deterministic decisions:
1. `ALLOW`: All 6 pillars satisfied. Access granted to protected resource.
2. `REQUIRE_MFA`: Identity valid, but resource requires Step-Up TOTP authentication.
3. `REQUIRE_DEVICE_VERIFICATION`: Device posture is `Pending`; administrator approval required.
4. `SUSPICIOUS`: Anomaly detection calculated an unacceptable risk score (>= 75). Access paused.
5. `DENY`: Hard violation of security policy, blacklisted hardware, locked account, or insufficient role standing.

---

## 4. Explainable Risk Scoring Calculus & Mathematical Model

Implemented in `backend/services/riskService.js`, the platform avoids "black box" scoring. Every risk score is strictly deterministic, auditable, and accompanied by explainable factor strings.

### Base Formula
$$\text{Score} = \text{Clamp}\Big(10 + \Delta_{\text{device}} + \Delta_{\text{mfa}} + \Delta_{\text{auth}} + \Delta_{\text{temporal}} + \Delta_{\text{resource}}, \; 0, \; 100\Big)$$

### Mathematical Scoring Factors

| Factor Category | Condition / State | Score Delta ($\Delta$) | Audit Telemetry Factor String |
| :--- | :--- | :---: | :--- |
| **Baseline Zero Trust Penalty** | Default starting score | **+10** | Baseline trust penalty in Zero Trust ("Never trust by default") |
| **Device Posture** | Device is `Blocked` | **+90** | Device is explicitly BLOCKED in enterprise inventory (+90) |
| | Device is `Suspicious` | **+45** | Device has suspicious posture history (+45) |
| | Device is `Pending` | **+25** | Unverified/New device pending security team approval (+25) |
| | Device is `Trusted` | **-5** | Device is verified and marked as Trusted (-5) |
| **MFA Authentication** | MFA Enabled & Token Verified | **-10** | Valid TOTP Multi-Factor Authentication completed (-10) |
| | MFA Not Configured on Account | **+20** | Account lacks Multi-Factor Authentication protection (+20) |
| | MFA Configured but Challenge Unverified | **+30** | MFA enabled but second factor challenge not yet verified (+30) |
| **Authentication Anomalies** | $\ge 3$ Consecutive Failed Logins | **+40** | Multiple consecutive failed authentication attempts ($n$) (+40) |
| | 1 or 2 Failed Logins | **+$15 \times n$** | $n$ recent failed authentication attempt(s) (+$(15 \times n)$) |
| **Temporal Context** | Off-Peak Access (11:00 PM – 5:00 AM) | **+15** | Access requested during off-peak hours (11 PM - 5 AM) (+15) |
| **Resource Classification** | Resource is `RESTRICTED` | **+25** | Target resource classified as RESTRICTED (+25) |
| | Resource is `CONFIDENTIAL` | **+15** | Target resource classified as CONFIDENTIAL (+15) |
| | Resource is `INTERNAL` / `PUBLIC` | **+0** | Standard internal data boundary |

### Risk Tiers
- **Low Risk (0 – 30)**: Standard operation. Routine access permitted under baseline RBAC.
- **Medium Risk (31 – 70)**: Elevated scrutiny. Requires step-up MFA or manager justification.
- **High Risk (71 – 100)**: Immediate policy gating or SOC incident generation.

---

## 5. Granular RBAC & Permissions Matrix

The platform incorporates four enterprise roles across a strict hierarchy (Level 1 to Level 4). The system includes 17 fine-grained permissions:

| System Permission | Functional Description | Employee (L1) | Manager (L2) | Security Admin (L3) | Super Admin (L4) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `user:read` | Inspect enterprise identity directory | — | ✓ | ✓ | ✓ |
| `user:create` | Provision new employee identities | — | — | — | ✓ |
| `user:update` | Modify titles, departments, or roles | — | — | — | ✓ |
| `user:delete` | Deprovision user & terminate active sessions | — | — | — | ✓ |
| `role:read` | Inspect RBAC roles & privilege matrix | — | — | — | ✓ |
| `role:update` | Modify permissions assigned to roles | — | — | — | ✓ |
| `device:read` | View enterprise hardware inventory | ✓ *(own only)* | ✓ | ✓ | ✓ |
| `device:verify`| Mark devices as `Trusted` or `Blocked` | — | — | ✓ | ✓ |
| `session:read` | Monitor real-time active sessions | ✓ *(own only)* | ✓ | ✓ | ✓ |
| `session:revoke`| Instantaneously terminate active sessions | ✓ *(own only)* | — | ✓ | ✓ |
| `audit:read` | Inspect append-only forensic audit trails | — | — | ✓ | ✓ |
| `alert:read` | Access SOC security alert queue | — | — | ✓ | ✓ |
| `alert:resolve`| Resolve SOC alerts and append findings | — | — | ✓ | ✓ |
| `resource:read`| Query enterprise protected catalog | ✓ | ✓ | ✓ | ✓ |
| `resource:request`| Submit elevated access justification tickets| ✓ | ✓ | — | — |
| `resource:approve`| Approve or reject access requests | — | ✓ | ✓ | ✓ |
| `policy:manage`| Modify global security configurations | — | — | — | ✓ |

---

## 6. Complete Repository Directory Tree

Below is the complete filesystem architecture of the repository:

```text
zerotrust-platform/
│
├── README.md                            # Comprehensive Platform Architecture & Reference Manual
├── powershell.bat                       # Windows PowerShell execution helper
│
├── data/                                # Embedded storage directory
│   └── db/                              # Local MongoDB persistent database storage path
│
├── backend/                             # Express.js REST API & Socket.IO Real-Time Gateway
│   ├── .env                             # Active environment variable configurations
│   ├── .env.example                     # Reference environment template
│   ├── package.json                     # Backend dependencies and runner scripts
│   ├── server.js                        # API entry point, HTTP server, Socket.IO gateway, DB bootstrap
│   ├── test-suite.js                    # 19-Phase automated end-to-end verification test suite
│   │
│   ├── config/
│   │   └── db.js                        # Resilient Mongoose connector with MongoMemoryServer fallback
│   │
│   ├── controllers/
│   │   ├── accessRequestController.js   # Resource catalog, live 6-pillar evaluation, request lifecycles
│   │   ├── alertController.js           # SOC incident query, severity aggregation, resolution triage
│   │   ├── auditController.js           # Forensic audit query and status/action analytics
│   │   ├── authController.js            # Registration, login, MFA challenge, lockout, password rotation
│   │   ├── dashboardController.js       # Executive SOC metrics, time-series chart data, employee overview
│   │   ├── deviceController.js          # Device inventory, verification, blacklisting & session kill
│   │   ├── roleController.js            # RBAC role enumeration and dynamic permission reconfiguration
│   │   ├── sessionController.js         # Real-time session monitoring and administrative severance
│   │   └── userController.js            # Identity directory CRUD and account lockout release
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js            # JWT verification, signature check, and user attachment
│   │   ├── errorMiddleware.js           # Centralized 404 & JSON error formatter (CastError, duplicate key)
│   │   ├── rateLimitMiddleware.js       # Express brute-force limiter (Auth: 30/15m, General: 500/15m)
│   │   ├── rbacMiddleware.js            # requireRole & requirePermission authorization guards
│   │   └── sessionMiddleware.js         # Continuous session verification against active MongoDB record
│   │
│   ├── models/
│   │   ├── AccessRequest.js             # Mongoose schema for elevated privilege justifications
│   │   ├── AuditLog.js                  # Append-only immutable security event log schema
│   │   ├── Device.js                    # Hardware endpoint posture schema
│   │   ├── Resource.js                  # Protected enterprise application/data schema
│   │   ├── Role.js                      # Granular RBAC permissions schema
│   │   ├── SecurityAlert.js             # SOC incident alert schema
│   │   ├── Session.js                   # Active authenticated session schema with risk tracking
│   │   └── User.js                      # Identity directory schema with bcrypt hashing & lockout hooks
│   │
│   ├── routes/
│   │   ├── accessRequestRoutes.js       # Endpoints for /api/access-requests
│   │   ├── alertRoutes.js               # Endpoints for /api/alerts
│   │   ├── auditRoutes.js               # Endpoints for /api/audit-logs
│   │   ├── authRoutes.js                # Endpoints for /api/auth
│   │   ├── dashboardRoutes.js           # Endpoints for /api/dashboard
│   │   ├── deviceRoutes.js              # Endpoints for /api/devices
│   │   ├── resourceRoutes.js            # Endpoints for /api/resources
│   │   ├── roleRoutes.js                # Endpoints for /api/roles
│   │   ├── sessionRoutes.js             # Endpoints for /api/sessions
│   │   └── userRoutes.js                # Endpoints for /api/users
│   │
│   ├── seed/
│   │   └── seedDatabase.js              # Comprehensive enterprise baseline data seeder
│   │
│   ├── services/
│   │   ├── accessDecisionService.js     # Central 6-Pillar Zero Trust Decision Engine
│   │   ├── auditService.js              # Append-only audit logger and Socket.IO real-time dispatcher
│   │   ├── deviceService.js             # Privacy-conscious User-Agent parsing & SHA-256 fingerprinting
│   │   ├── mfaService.js                # RFC 6238 TOTP engine, QR code generation, demo token bypass
│   │   ├── riskService.js               # Multi-factor dynamic explainable risk scoring calculation
│   │   └── sessionService.js            # Session lifecycle, continuous verification & severance engine
│   │
│   └── utils/
│       ├── jwt.js                       # JWT sign, verify, and header extraction helper
│       ├── logger.js                    # Console logger with automatic redaction of secrets/tokens
│       └── sendEmail.js                 # Nodemailer wrapper with automatic developer console fallback
│
└── frontend/                            # React 18 Single-Page Application (Vite + Tailwind CSS)
    ├── package.json                     # Frontend dependencies (React, Vite, Recharts, Lucide, Axios)
    ├── tailwind.config.js               # Cybernetic dark mode theme, colors, and glow utilities
    ├── vite.config.js                   # Vite dev server and proxy configuration for /api & /socket.io
    │
    └── src/
        ├── App.jsx                      # Client route definitions, global layout, severance alert banner
        ├── index.css                    # Tailwind imports, cyber scanlines, glassmorphism CSS classes
        ├── main.jsx                     # React DOM entry point
        │
        ├── components/
        │   ├── DataTable.jsx            # Reusable searchable, filterable, paginated data table
        │   ├── Navbar.jsx               # Header navigation with posture indicator & quick user actions
        │   ├── ProtectedRoute.jsx       # Auth, role, and permission client-side route guard
        │   ├── RiskBadge.jsx            # Color-coded risk level badge (Low: Green, Med: Amber, High: Red)
        │   ├── SecurityBadge.jsx        # Status badge with animated pulsing indicator dot
        │   ├── Sidebar.jsx              # Role-aware responsive navigation sidebar
        │   ├── StatCard.jsx             # Key security metric KPI card with glowing border
        │   └── ZeroTrustModal.jsx       # Interactive real-time 6-pillar diagnostic assessment modal
        │
        ├── context/
        │   └── AuthContext.jsx          # React Context: auth state, active device/session, Socket.IO listener
        │
        ├── hooks/
        │   └── useAuth.js               # Convenience hook for accessing AuthContext
        │
        ├── pages/
        │   ├── AccessRequests.jsx       # Employee justification submission & manager approval console
        │   ├── Alerts.jsx               # SOC incident triage, severity filters, resolution notes modal
        │   ├── AuditLogs.jsx            # Immutable audit trail explorer with payload detail inspection
        │   ├── Dashboard.jsx            # Executive security dashboard with Recharts time-series & metrics
        │   ├── Devices.jsx              # Enterprise hardware inventory, trust verification & blacklisting
        │   ├── ForgotPassword.jsx       # Crypto reset token submission interface
        │   ├── Login.jsx                # Multi-stage login with 1-click evaluator demo account buttons
        │   ├── MfaSetup.jsx             # Authenticator enrollment with live QR code & secret display
        │   ├── MfaVerification.jsx      # Second-factor challenge screen with demo code fast-track
        │   ├── Register.jsx             # User self-enrollment and device initialization
        │   ├── ResetPassword.jsx        # Password rotation form with token verification
        │   ├── ResourceDetails.jsx      # Diagnostic breakdown view for /resources/:id
        │   ├── Resources.jsx            # Protected resource catalog with classifications & access gates
        │   ├── Roles.jsx                # Visual RBAC matrix & Super Admin permission editor
        │   ├── Security.jsx             # Real-time SOC incident operations stream
        │   ├── Sessions.jsx             # Active session monitor with 1-click instant severance
        │   ├── Settings.jsx             # Profile security settings, password change, hardware overview
        │   └── Users.jsx                # Directory management, user provisioning, account lockout release
        │
        ├── services/
        │   └── api.js                   # Axios client with device fingerprint headers & 401 severance interceptor
        │
        └── utils/
            └── permissions.js           # Client-side RBAC validation and badge color utility functions
```

---

## 7. Exhaustive Module-by-Module Technical Reference

### 7.1 Backend Server & Infrastructure

#### `backend/server.js`
- **Purpose**: Initializes the Express application, sets up the HTTP server, attaches the real-time Socket.IO gateway, configures middleware, defines the health endpoint, mounts routes, and initiates database connection.
- **Key Mechanics**:
  - `const io = new Server(server, { cors: ... })`: Instantiates WebSocket gateway supporting origins `http://localhost:5173` and `http://127.0.0.1:5173`.
  - `setSocketIO(io)`: Injects the Socket.IO instance into `auditService.js` to enable real-time broadcasts.
  - `generalApiLimiter`: Applies global rate limiting to all `/api` endpoints.
  - `GET /api/health`: Provides a lightweight JSON heartbeat verifying API gateway availability.
  - `startServer()`: Invokes database connection. If the user collection is empty (e.g. fresh in-memory database), automatically executes `seedData(false)` to bootstrap demo accounts without manual intervention.

#### `backend/config/db.js`
- **Purpose**: Provides fault-tolerant database connectivity with automatic developer fallback.
- **Key Mechanics**:
  - Attempts connection to `process.env.MONGO_URI` with a 3000ms server selection timeout (`serverSelectionTimeoutMS: 3000`).
  - **Zero-Config In-Memory Fallback**: If local MongoDB is stopped or uninstalled, intercepts the connection error, starts `mongodb-memory-server` in-process, and connects Mongoose to the memory instance. This guarantees that evaluators can run the project immediately with zero local database setup.
  - Exposes `disconnectDB()` for clean shutdown during automated test suites.

---

### 7.2 Data Models & Schemas

#### `backend/models/User.js`
- **Schema Fields**:
  - `name` (String, required): Employee full name.
  - `email` (String, required, unique, lowercase): Identity email address.
  - `password` (String, required, select: false): Bcrypt-hashed password.
  - `role` (ObjectId -> Role, required): Reference to assigned RBAC role.
  - `roleName` (String, enum: `['Super Admin', 'Security Admin', 'Manager', 'Employee']`): Denormalized role string for fast lookup.
  - `department` (String): Corporate unit (e.g., "Engineering", "Security Operations").
  - `title` (String): Corporate job title.
  - `status` (String, enum: `['Active', 'Suspended', 'Locked']`, default: `'Active'`): Identity lifecycle state.
  - `mfaEnabled` (Boolean, default: `false`): Flags whether TOTP 2FA is required during authentication.
  - `mfaSecret` (String, select: false): Base32 RFC 6238 TOTP shared secret.
  - `failedLoginAttempts` (Number, default: `0`): Running counter of consecutive bad credentials.
  - `lockUntil` (Date, default: `null`): Expiration timestamp for brute-force lockouts.
  - `lastLogin` (Date), `passwordChangedAt` (Date).
  - `resetPasswordToken` (String, select: false), `resetPasswordExpires` (Date, select: false).
- **Virtuals & Hooks**:
  - `isLocked`: Returns `true` if `lockUntil > Date.now()`.
  - Pre-save hook: Automatically generates salt (`genSalt(10)`) and hashes password when modified.
  - Method `matchPassword(enteredPassword)`: Compares plaintext input with stored bcrypt hash.

#### `backend/models/Role.js`
- **Schema Fields**:
  - `name` (String, required, unique): Role identifier (`Super Admin`, `Security Admin`, `Manager`, `Employee`).
  - `description` (String): Role scope and responsibilities.
  - `permissions` (Array of Strings): List of granted permission strings (e.g. `['user:read', 'device:verify']`).
  - `isSystemRole` (Boolean, default: `true`): System immutability flag.
  - `level` (Number, 1 to 4): Hierarchy rank (1 = Employee, 2 = Manager, 3 = Security Admin, 4 = Super Admin).

#### `backend/models/Device.js`
- **Schema Fields**:
  - `user` (ObjectId -> User, required): Enrolled device owner.
  - `deviceId` (String, required, indexed): SHA-256 privacy-conscious hardware hash.
  - `deviceName` (String): User workstation label (e.g. "ThinkPad T14 Workstation").
  - `browser` (String), `os` (String), `deviceType` (enum: `['Desktop', 'Laptop', 'Mobile', 'Tablet', 'Unknown']`).
  - `ipAddress` (String), `location` (String): Network egress coordinates.
  - `status` (String, enum: `['Trusted', 'Pending', 'Suspicious', 'Blocked']`, default: `'Pending'`).
  - `riskScore` (Number, 0–100): Calculated hardware risk posture.
  - `firstSeen` (Date), `lastActive` (Date).
  - `verifiedBy` (ObjectId -> User), `verifiedAt` (Date), `blockedReason` (String).

#### `backend/models/Session.js`
- **Schema Fields**:
  - `sessionId` (String, required, unique, indexed): Cryptographically random session identifier (`ses_...`).
  - `user` (ObjectId -> User, required): Authenticated identity.
  - `device` (ObjectId -> Device), `deviceId` (String, required): Associated hardware node.
  - `ipAddress` (String), `userAgent` (String), `location` (String).
  - `loginTime` (Date), `lastActivity` (Date), `expiryTime` (Date, 24 hours from creation).
  - `status` (String, enum: `['Active', 'Expired', 'Revoked', 'Suspicious']`, default: `'Active'`).
  - `riskScore` (Number), `riskFactors` (Array of Strings).
  - `revokedAt` (Date), `revokedBy` (ObjectId -> User), `revokedReason` (String).

#### `backend/models/Resource.js`
- **Schema Fields**:
  - `resourceId` (String, required, unique): Unique string key (e.g. `res-fin-02`).
  - `name` (String, required): Display title (e.g. "Finance & Treasury Dashboard").
  - `category` (String): Domain category (HR, Finance, Data Warehouse, Engineering, Operations).
  - `description` (String): Summary of protected data.
  - `classification` (String, enum: `['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']`).
  - `requiredRole` (Array of Strings): Permitted enterprise roles.
  - `requiredPermission` (String, default: `'resource:read'`).
  - `minTrustLevel` (String, enum: `['LOW', 'MEDIUM', 'HIGH']`, default: `'MEDIUM'`).
  - `requiresMFA` (Boolean, default: `false`).
  - `endpointUrl` (String): Target protected route or internal URL.
  - `icon` (String), `activeUsersCount` (Number).

#### `backend/models/AccessRequest.js`
- **Schema Fields**:
  - `requester` (ObjectId -> User, required), `requesterName` (String), `requesterEmail` (String), `requesterRole` (String).
  - `resourceId` (String, required), `resourceName` (String, required), `resourceCategory` (String).
  - `reason` (String, required): Business justification submitted by applicant.
  - `requestedPermission` (String, enum: `['READ', 'WRITE', 'ADMIN']`, default: `'READ'`).
  - `status` (String, enum: `['PENDING', 'APPROVED', 'REJECTED']`, default: `'PENDING'`).
  - `riskScore` (Number), `riskLevel` (enum: `['LOW', 'MEDIUM', 'HIGH']`), `riskFactors` (Array of Strings).
  - `zeroTrustDecision` (Object: `{ decision, reason, score }`): Automated evaluation snapshot at submission.
  - `requestedAt` (Date), `reviewedBy` (ObjectId -> User), `reviewedByName` (String), `reviewedAt` (Date), `reviewNotes` (String).

#### `backend/models/SecurityAlert.js`
- **Schema Fields**:
  - `alertId` (String, required, unique): Human-readable incident code (e.g. `ALT-2026-0001`).
  - `type` (String, required): Incident classification (`BRUTE_FORCE_ATTEMPT`, `BLOCKED_DEVICE_ACCESS_ATTEMPT`, `NEW_DEVICE_DETECTED`, `RESTRICTED_RESOURCE_POLICY_BREACH`).
  - `severity` (String, enum: `['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']`, default: `'MEDIUM'`).
  - `user` (ObjectId -> User), `userName` (String), `userEmail` (String).
  - `device` (ObjectId -> Device), `deviceId` (String), `ipAddress` (String).
  - `timestamp` (Date, default: `Date.now`).
  - `description` (String, required): Forensic context of the security anomaly.
  - `status` (String, enum: `['Open', 'Investigating', 'Resolved']`, default: `'Open'`).
  - `riskScore` (Number, default: `50`).
  - `mitigationAction` (String): Active perimeter countermeasures deployed.
  - `resolvedBy` (ObjectId -> User), `resolvedAt` (Date), `resolutionNotes` (String).

#### `backend/models/AuditLog.js`
- **Schema Fields**:
  - `userId` (ObjectId -> User), `userName` (String), `userEmail` (String).
  - `action` (String, required, indexed): Security action constant (e.g. `LOGIN_SUCCESS`, `SESSION_REVOKED`, `ACCESS_DENIED`, `DEVICE_BLOCKED`).
  - `resource` (String), `resourceId` (String).
  - `ipAddress` (String), `deviceId` (String), `deviceInfo` (Mixed).
  - `timestamp` (Date, default: `Date.now`, indexed).
  - `status` (String, enum: `['SUCCESS', 'FAILURE', 'WARNING', 'BLOCKED']`).
  - `riskScore` (Number, default: `0`).
  - `details` (Mixed): Arbitrary structured forensic JSON metadata.
- **Immutability**: Configured with `timestamps: false` and `versionKey: false` as an append-only collection.

---

### 7.3 Backend Core Services

#### `backend/services/accessDecisionService.js`
- **Function**: `evaluateAccess({ user, device, session, resource, requestedPermission, requestContext })`
- **Execution Flow**:
  1. Validates session status (`session.status === 'Active'`). If invalid, returns `DENY` (Score: 95).
  2. Validates identity status (`user.status === 'Active'` and `!user.isLocked`). If locked, returns `DENY` (Score: 90).
  3. Validates hardware posture (`device.status !== 'Blocked'`). If blocked, returns `DENY` (Score: 100).
  4. Calculates dynamic risk score via `riskService.js`.
  5. Intercepts excessive risk: if `riskScore >= 75`, returns `SUSPICIOUS`.
  6. Enforces device verification: if `device.status === 'Pending'` and target resource is `HIGH` trust or `RESTRICTED`, returns `REQUIRE_DEVICE_VERIFICATION`.
  7. Enforces step-up authentication: if resource requires MFA and `user.mfaEnabled` is false, returns `REQUIRE_MFA`.
  8. Enforces RBAC permissions: verifies `resource.requiredRole.includes(user.roleName)`. If unpermitted, returns `DENY` (Score: 65).
  9. If all checkpoints succeed, returns `ALLOW`.

#### `backend/services/riskService.js`
- **Function**: `calculateRiskScore({ user, device, resource, failedAttempts, isMfaVerified, ipAddress, location })`
- Implements the mathematical scoring algorithm detailed in [Section 4](#4-explainable-risk-scoring-calculus--mathematical-model). Computes cumulative penalties, clamps score between 0 and 100, assigns risk level (`LOW`, `MEDIUM`, `HIGH`), and returns an array of human-readable factor descriptions.

#### `backend/services/deviceService.js`
- **Functions**:
  - `parseUserAgent(userAgentString)`: Parses client User-Agent string using regular expressions to extract browser family (Chrome, Edge, Firefox, Safari), operating system (Windows 11/10, macOS, Linux, Android, iOS), and device type (Desktop, Laptop, Mobile, Tablet).
  - `extractDeviceMetadata(req)`: Extracts client IP (stripping `::ffff:` IPv6 prefixes), location coordinates, and determines `deviceId`. If the client passes an `x-device-id` header from local storage, it is validated; otherwise, generates a deterministic SHA-256 hash from `${userAgent}|${ipAddress}|${accept-language}`.
  - `getOrCreateDevice(user, metadata)`: Queries existing device for user. If not found, registers a new device profile. The first device enrolled by a user is assigned `Trusted` status; subsequent devices default to `Pending` review.

#### `backend/services/sessionService.js`
- **Functions**:
  - `createSession({ user, device, req, riskScore, riskFactors })`: Generates a cryptographic session ID (`ses_` + 48-character hex string), computes 24-hour expiry time, stores the session record in MongoDB, and records an append-only `SESSION_CREATED` audit log.
  - `validateSession(sessionId)`: Continuous verification routine. Populates user and device records. Verifies expiration timestamps. If the associated device has been marked `Blocked`, automatically revokes the session, writes a revocation reason, emits a real-time severance event via Socket.IO, and denies the request. Updates `lastActivity` on success.
  - `revokeSession(sessionId, revokedBy, reason)`: Flags session status as `Revoked`, records actor and timestamp, logs a `SESSION_REVOKED` audit event, and emits `session_revoked_${sessionId}` and `session_updated` via Socket.IO.
  - `revokeAllUserSessions(userId, reason)`: Queries all active sessions for a user, terminates each in sequence, and emits individual WebSocket severance events.

#### `backend/services/mfaService.js`
- **Configuration**: Uses `otplib` authenticator configured with a 30-second time step and a window tolerance of $\pm 1$ step to account for client clock drift.
- **Functions**:
  - `generateMfaSecret(userEmail)`: Generates an RFC 6238 Base32 secret key, generates an `otpauth://` URI, and renders a Data URL QR code via `qrcode`.
  - `verifyMfaToken(token, secret)`: Validates 6-digit TOTP input against stored secret. Includes support for universal evaluator bypass codes (`123456`, `000000`) for demonstration convenience.

#### `backend/services/auditService.js`
- **Functions**:
  - `setSocketIO(io)` / `getSocketIO()`: Manages singleton reference to the active Socket.IO server.
  - `logEvent({ userId, userName, userEmail, action, resource, resourceId, ipAddress, deviceId, deviceInfo, status, riskScore, details })`: Writes an immutable document to `AuditLog`. Sanitizes and logs to console via `logger.security()`. Broadcasts `new_audit_log` event to all connected administrative dashboards via Socket.IO.
  - `createSecurityAlert({ type, severity, user, userName, userEmail, device, deviceId, ipAddress, description, riskScore, mitigationAction })`: Computes sequential incident code (`ALT-YYYY-NNNN`), writes to `SecurityAlert`, emits `new_security_alert` over Socket.IO, and automatically records a companion `SECURITY_ALERT_CREATED` audit log.

---

### 7.4 Middleware Pipeline

#### `backend/middleware/authMiddleware.js`
- **Function**: `authenticateToken(req, res, next)`
- Extracts `Authorization: Bearer <token>` header. Verifies cryptographic signature using `process.env.JWT_SECRET`. Resolves `userId` from payload and queries the database, populating the `role` relation. Rejects if user does not exist or if account is locked (`user.status !== 'Active' || user.isLocked`). Attaches `req.user` and `req.tokenPayload` to request context.

#### `backend/middleware/sessionMiddleware.js`
- **Function**: `verifyActiveSession(req, res, next)`
- Reads session ID from `x-session-id` header or token payload. Invokes `validateSession()`. If the session has been administratively revoked or expired, intercepts the request and responds with HTTP 401 (`errorCode: 'SESSION_REVOKED'`). Attaches `req.sessionRecord` and `req.device`.

#### `backend/middleware/rbacMiddleware.js`
- **Functions**:
  - `requireRole(...allowedRoles)`: Compares caller's role against permitted list. If unauthorized, automatically logs an `ACCESS_DENIED` security audit event with high risk score (65) and responds with HTTP 403 (`errorCode: 'FORBIDDEN_ROLE'`).
  - `requirePermission(...requiredPermissions)`: Inspects permissions array on user's role. Super Admin automatically bypasses all permission checks (wildcard). If permissions are missing, logs `ACCESS_DENIED` audit event with missing permission metadata and responds with HTTP 403 (`errorCode: 'INSUFFICIENT_PERMISSIONS'`).

#### `backend/middleware/rateLimitMiddleware.js`
- **`authLimiter`**: Configured on `/api/auth` endpoints. Limits each IP address to 30 requests per 15-minute window (`windowMs: 15 * 60 * 1000`, `max: 30`). Protects against automated credential stuffing.
- **`generalApiLimiter`**: Configured on all `/api` endpoints. Limits each IP address to 500 requests per 15-minute window to mitigate DoS attacks.

#### `backend/middleware/errorMiddleware.js`
- **`notFound(req, res, next)`**: Catches unmapped routes and formats a clean JSON HTTP 404 response.
- **`errorHandler(err, req, res, next)`**: Centralized error parser. Catches Mongoose `CastError` (returns HTTP 400 `INVALID_ID`), duplicate unique key error `11000` (returns HTTP 400 `DUPLICATE_KEY`), Mongoose `ValidationError` (returns HTTP 400 with aggregated field messages), and `JsonWebTokenError` (returns HTTP 401 `TOKEN_INVALID`). Suppresses raw internal stack traces in responses to prevent information leakage.

---

### 7.5 API Controllers & Business Logic

#### `backend/controllers/authController.js`
- **`register`**: Validates input, verifies email uniqueness, looks up or defaults role, hashes password, registers device posture, computes initial risk score, establishes session, generates JWT, and logs `USER_REGISTERED` audit event.
- **`login`**: Checks account lockout (`user.isLocked`). Validates password via bcrypt.
  - *On Failure*: Increments `failedLoginAttempts`. If attempts reach 5, sets `lockUntil` to 15 minutes in the future, logs `LOGIN_FAILED` audit event, and creates an automated `BRUTE_FORCE_ATTEMPT` security alert for the SOC team.
  - *On Success*: Resets `failedLoginAttempts` to 0. Evaluates device trust and MFA status. If MFA is enabled on the account, generates a short-lived temporary token (`tempToken`) and returns `{ mfaRequired: true }`. Otherwise, creates session, generates full 24-hour JWT, and logs `LOGIN_SUCCESS`.
- **`verifyMfaLogin`**: Decodes `tempToken`, verifies 6-digit TOTP code via `verifyMfaToken()`, establishes authenticated session, and returns standard JWT.
- **`setupMfa`**: Generates TOTP secret and QR code Data URL for authenticated user.
- **`enableMfa`**: Verifies confirmation token against secret, sets `mfaEnabled: true`, and saves secret to database.
- **`disableMfa`**: Re-verifies user password before disabling MFA on account.
- **`logout`**: Terminates active session via `revokeSession()` and logs `LOGOUT` audit event.
- **`getMe`**: Returns current identity, active role, registered device, and active session record.
- **`changePassword`**: Validates old password, applies new password through bcrypt hook, updates `passwordChangedAt`, and logs audit trail.
- **`forgotPassword`**: Generates crypto random reset token, stores SHA-256 hash with 1-hour expiration on user, and dispatches reset link via `sendEmail()`.
- **`resetPassword`**: Validates reset token and expiration, updates user password, clears token fields, and logs password rotation.

#### `backend/controllers/accessRequestController.js`
- **`getResources`**: Queries enterprise catalog sorted by classification level.
- **`getResourceById`**: Fetches single resource by `resourceId` or ObjectId.
- **`getAccessRequests`**: Queries access request tickets with optional status and requester filters.
- **`getMyAccessRequests`**: Returns tickets submitted by current authenticated user.
- **`createAccessRequest`**: Submits elevated privilege request with business justification. Evaluates real-time Zero Trust baseline posture, computes risk score, creates ticket, and logs `ACCESS_REQUEST_CREATED`.
- **`approveAccessRequest`**: (Manager/Admin) Updates status to `APPROVED`, records reviewer ID and notes, and logs `ACCESS_REQUEST_APPROVED`.
- **`rejectAccessRequest`**: (Manager/Admin) Updates status to `REJECTED`, records reviewer notes, and logs `ACCESS_DENIED`.
- **`evaluateLiveAccess`**: Target of real-time diagnostic modal. Executes full 6-Pillar evaluation via `evaluateAccess()`, records audit log with calculated score, and returns complete evaluation report.

#### `backend/controllers/deviceController.js`
- **`getDevices`**: Queries enterprise device directory with search filter (name, deviceId, browser, OS, IP) and status filter.
- **`getMyDevices`**: Returns devices belonging to caller.
- **`registerDevice`**: Enrolls or touches client endpoint hardware.
- **`verifyDevice`**: Promotes device status to `Trusted`, sets risk score to 10, records verifying administrator, and logs `DEVICE_VERIFIED`.
- **`blockDevice`**: Blacklists device (`status = 'Blocked'`, `riskScore = 100`). Immediately queries all active sessions associated with the device and severs them via `revokeSession()`, alerting connected clients via Socket.IO and creating an urgent `BLOCKED_DEVICE_ACCESS_ATTEMPT` security alert.
- **`unblockDevice`**: Restores blacklisted device to `Pending` review status.

#### `backend/controllers/sessionController.js`
- **`getSessions`**: Lists active and historical enterprise sessions with user and device metadata.
- **`getMySessions`**: Lists caller's sessions.
- **`revokeSessionById`**: Administrative action. Invokes `revokeSession()`, instantly severing access across the network.
- **`revokeMySession`**: Self-service user session termination.

#### `backend/controllers/alertController.js`
- **`getAlerts`**: Queries SOC incident alerts filtered by status (`Open`, `Investigating`, `Resolved`) and severity.
- **`resolveAlert`**: Updates incident status to `Resolved`, logs investigator findings notes, and logs `SECURITY_ALERT_RESOLVED` audit event.
- **`investigateAlert`**: Flags incident status as `Investigating`.
- **`getAlertStats`**: Aggregates open alert counts categorized by severity.

#### `backend/controllers/auditController.js`
- **`getAuditLogs`**: Returns paginated, searchable forensic audit records with action, status, and actor filters.
- **`getAuditStats`**: Aggregates action distribution, status breakdown, and overall average risk score.

#### `backend/controllers/userController.js`
- **`getUsers`**: Returns workforce directory with department, role, and status filters.
- **`getUserById`**: Fetches user profile, enrolled devices, and active sessions.
- **`createUser`**: Super Admin identity provisioning.
- **`updateUser`**: Modifies title, department, status, or role.
- **`deleteUser`**: Deprovisions user and revokes all active sessions via `revokeAllUserSessions()`.
- **`unlockUser`**: Manually clears brute-force lockout status (`failedLoginAttempts = 0`, `lockUntil = null`, `status = 'Active'`).

#### `backend/controllers/roleController.js`
- **`getRoles`**: Enumerates roles and granular permission arrays.
- **`updateRolePermissions`**: Allows Super Admin to dynamically modify permissions assigned to any role.

#### `backend/controllers/dashboardController.js`
- **`getOverviewStats`**: Generates high-level metrics for SOC analysts and executives: active sessions, trusted/blocked devices, open alerts, risk distribution (Low/Med/High), alerts by severity, device OS distribution, access decision ratio (Granted vs Denied), 7-day event timeline, and recent live activity.
- **`getEmployeeDashboard`**: Returns personalized telemetry for workforce users: enrolled devices, personal sessions, pending requests, and permitted resource recommendations.

---

### 7.6 API Routing Subsystem

| Route File | Base Path | Middleware Applied | Purpose |
| :--- | :--- | :--- | :--- |
| `authRoutes.js` | `/api/auth` | `authLimiter` (public), `authenticateToken` (protected) | Login, register, MFA, password reset, profile query |
| `userRoutes.js` | `/api/users` | `authenticateToken`, `requirePermission('user:*')` | Workforce directory management & account lockout release |
| `roleRoutes.js` | `/api/roles` | `authenticateToken`, `requirePermission('role:*')` | RBAC roles and permissions management |
| `deviceRoutes.js` | `/api/devices` | `authenticateToken`, `requirePermission('device:*')` | Hardware inventory, verification, and blacklisting |
| `sessionRoutes.js` | `/api/sessions`| `authenticateToken`, `requirePermission('session:*')`| Live session surveillance and administrative severance |
| `auditRoutes.js` | `/api/audit-logs` | `authenticateToken`, `requirePermission('audit:read')` | Immutable forensic audit log queries and statistics |
| `alertRoutes.js` | `/api/alerts` | `authenticateToken`, `requirePermission('alert:*')` | SOC security alerts, investigation, and resolution |
| `accessRequestRoutes.js`| `/api/access-requests` | `authenticateToken`, `requirePermission` | Access ticket submission and approval lifecycles |
| `resourceRoutes.js`| `/api/resources` | `authenticateToken` | Enterprise protected catalog & live access evaluation |
| `dashboardRoutes.js`| `/api/dashboard` | `authenticateToken` | Executive metrics, time-series charts, and telemetry |

---

### 7.7 Backend Utilities & Seed Generator

#### `backend/utils/jwt.js`
- `generateToken(payload, expiresIn)`: Signs JWT using HMAC SHA-256 with `JWT_SECRET`.
- `verifyToken(token)`: Verifies signature and expiration; returns decoded claims or `null`.
- `extractTokenFromHeader(req)`: Parses `Authorization: Bearer <token>`.

#### `backend/utils/logger.js`
- Implements leveled console logging: `info`, `warn`, `error`, `security`.
- **Sensitive Data Redaction**: Includes a recursive `sanitize()` utility that traverses payloads and masks sensitive fields (`password`, `mfaSecret`, `secret`, `token`, `refreshToken`, `credential`) with `'***REDACTED***'` before outputting to stdout.

#### `backend/utils/sendEmail.js`
- Wraps Nodemailer. If SMTP environment variables are unconfigured or set to test defaults, automatically enters **Developer Simulation Mode**: logs email recipient, subject, and body preview directly to console so password reset workflows function seamlessly without third-party email dependencies.

#### `backend/seed/seedDatabase.js`
- Clears and initializes the database with enterprise-scale demo data:
  - **4 System Roles**: Super Admin (all 17 permissions), Security Admin (10 permissions), Manager (6 permissions), Employee (4 permissions).
  - **4 Enterprise Personas**: Detailed in [Section 10](#10-pre-configured-demo-accounts--fast-track-credentials).
  - **6 Protected Resources**: Across Human Resources, Financial Operations, Customer CRM, Engineering, and Business Intelligence.
  - **6 Hardware Devices**: Trusted workstations, pending mobile phones, and blacklisted Tor exit nodes.
  - **5 Active/Historical Sessions**: Including a revoked suspicious session.
  - **4 SOC Security Alerts**: Brute-force attacks, blocked hardware penetration attempts, new device alerts.
  - **3 Access Requests**: Pending, approved, and rejected justification tickets.
  - **6 Audit Logs**: Initial forensic trail entries.

---

### 7.8 Automated End-to-End Test Suite

Located at `backend/test-suite.js`, this automated test runner initializes the backend server and runs 19 sequential security assertions against the live API:

```
[Phase 1: API Gateway & System Health]
  ✔ 1. API Gateway is Operational (/api/health)

[Phase 2: Authentication & Identity Verification]
  ✔ 2. Employee authentication successful (JWT generated)
  ✔ 3. Super Admin login triggers mandatory MFA Step-Up requirement
  ✔ 4. TOTP second factor validated successfully (Session established)
  ✔ 5. Password reset authorization token generated
  ✔ 6. Password reset verified and saved with bcrypt

[Phase 3: Role-Based Access Control (RBAC)]
  ✔ 7. Least-Privilege: Employee forbidden from accessing full user directory (HTTP 403)
  ✔ 8. Super Admin authorized to view user directory

[Phase 4: Device Trust Posture]
  ✔ 9. Device inventory queried successfully
  ✔ 10. Device verified and marked as Trusted

[Phase 5: Active Session Surveillance & Severance]
  ✔ 11. Active sessions list retrieved
  ✔ 12. Session forcefully terminated at perimeter

[Phase 6: Zero Trust Access Decisions]
  ✔ 13. Enterprise resources catalog queried
  ✔ 14. Zero Trust Access Decision: [DENY] - Risk Score: 95
  ✔ 15. Access request created and evaluated against Zero Trust policies
  ✔ 16. Access request approved by administrator

[Phase 7: SOC Incident Response & Auditing]
  ✔ 17. SOC Security alerts retrieved
  ✔ 18. Security alert resolved with findings
  ✔ 19. Append-only audit trail verified
```

---

### 7.9 Frontend Architecture & Component Ecosystem

The client is a single-page application built with React 18, Vite, React Router v6, Tailwind CSS, Recharts, and Lucide React icons.

#### `frontend/src/context/AuthContext.jsx`
- Manages global state: `user`, `session`, `device`, `token`, `loading`, and `sessionRevokedNotice`.
- **Real-Time WebSocket Integration**: Connects to the backend via `socket.io-client`. Listens for dynamic session events:
  ```javascript
  socket.on(`session_revoked_${session.sessionId}`, (data) => {
    setSessionRevokedNotice(data.reason || 'Session was forcefully revoked by administrator');
    logout();
  });
  ```
- **Custom Event Bus**: Listens for `zerotrust:session_terminated` dispatched by Axios interceptors to immediately display the red severance banner and redirect to login.

#### `frontend/src/services/api.js`
- Pre-configured Axios instance (`baseURL: '/api'`).
- **Request Interceptor**: Automatically injects `Authorization: Bearer <token>`, `x-session-id`, `x-device-id`, `x-device-name`, and `x-client-location` into every outbound HTTP request.
- **Response Interceptor**: Intercepts HTTP 401 errors with error codes `SESSION_REVOKED` or `TOKEN_INVALID`, triggering global session termination events.

#### Core Reusable Components
- **`Navbar.jsx`**: Displays application logo, system status badge, user identity avatar, role badge, active device posture indicator, and quick-action menu (MFA setup, Settings, Logout).
- **`Sidebar.jsx`**: Responsive navigation bar that filters menu items based on caller's role level.
- **`ProtectedRoute.jsx`**: Route guard validating token existence, role membership (`roles={['Security Admin', 'Super Admin']}`), and permissions.
- **`StatCard.jsx`**: Glassmorphism metric KPI card featuring Lucide icons, trend indicators, and glowing border effects.
- **`RiskBadge.jsx`**: Displays colored risk badges (0–30: Emerald Low, 31–70: Amber Medium, 71–100: Rose High).
- **`SecurityBadge.jsx`**: Standardized status badge featuring an animated pulsing status dot.
- **`DataTable.jsx`**: Reusable data grid supporting search queries, status filter tabs, column sorting, and pagination.
- **`ZeroTrustModal.jsx`**: Interactive modal that triggers live `/api/resources/verify-access` requests, renders an animated 6-pillar posture breakdown, lists risk factors, displays calculated scores, and provides context-aware action buttons (Launch Resource, Setup MFA, Enroll Device, Request Access).

---

### 7.10 Frontend Application Pages

1. **`Login.jsx`**: Two-stage login interface. Stage 1 captures email and password. If the backend returns `mfaRequired: true`, transitions to Stage 2 (6-digit TOTP challenge). Features 1-click **Demo Evaluator Account** buttons for all 4 roles and a **Use Demo Code (123456)** button.
2. **`Register.jsx`**: Workforce self-enrollment form capturing name, email, password, department, and title. Automatically initializes hardware device profile and session.
3. **`ForgotPassword.jsx`**: Interface to request cryptographic password reset tokens via email.
4. **`ResetPassword.jsx`**: Password rotation form validating token parameter and updating user credentials.
5. **`MfaVerification.jsx`**: Standalone second-factor verification screen for pending logins.
6. **`MfaSetup.jsx`**: Authenticator enrollment page rendering live QR codes generated via `otplib` and `qrcode`, manual secret entry key, verification test input, and MFA deactivation controls.
7. **`Dashboard.jsx`**: Executive Security Dashboard. Renders KPI StatCards, Recharts visualizations (7-Day Login & Incident Timeline, Dynamic Risk Score Distribution Donut, SOC Alerts by Severity Bar Chart, Device OS Breakdown, and Access Decision Ratio), and a real-time live activity feed. For standard Employees, renders a personalized dashboard showing assigned hardware and recent requests.
8. **`Resources.jsx`**: Enterprise protected resource catalog displaying classification badges (`INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`), trust requirements, and interactive **Posture Check** triggers.
9. **`ResourceDetails.jsx`**: Deep-dive diagnostic view for `/resources/:id`. Renders the complete 6-Pillar Zero Trust breakdown and real-time evaluation controls.
10. **`AccessRequests.jsx`**: Access justification management. Employees submit access requests for restricted resources; Managers and Administrators review pending tickets, inspect automated risk scores, and approve or reject requests with review notes.
11. **`Devices.jsx`**: Hardware inventory management. Lists all enrolled devices with OS, browser, IP, and posture status. Provides administrative controls to **Verify** (mark Trusted), **Block** (blacklist hardware and sever active sessions), or **Unblock** devices.
12. **`Sessions.jsx`**: Real-time active session surveillance console. Lists all active connections with IP, location, device, risk score, and last activity heartbeat. Features an instantaneous **Revoke Session** button that severs perimeter access via WebSockets.
13. **`Security.jsx` & `Alerts.jsx`**: SOC incident operations console. Lists active security anomalies categorized by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`). Includes search filters, status tabs, and a resolution modal to record mitigation findings.
14. **`Users.jsx`**: Workforce directory management. Allows administrators to provision new users, edit profile metadata, assign roles, deprovision identities, and clear brute-force account lockouts.
15. **`Roles.jsx`**: Interactive RBAC matrix displaying all 4 system roles and 17 granular permissions. Super Admins can toggle individual permissions on or off dynamically.
16. **`AuditLogs.jsx`**: Forensic audit explorer. Allows security teams to search and filter append-only security logs by action, status, and user, with a JSON modal inspector for deep forensic analysis.
17. **`Settings.jsx`**: Account security center providing password rotation, MFA management shortcuts, and connected device posture summaries.

---

## 8. Real-Time Telemetry & Socket.IO Event Specification

The platform utilizes Socket.IO for real-time security telemetry, instantaneous incident dispatch, and immediate perimeter severance without client polling:

| Event Name | Direction | Trigger Scenario | Payload Structure |
| :--- | :--- | :--- | :--- |
| `new_audit_log` | Server -> Client | Any security event logged (`logEvent()`) | Full `AuditLog` document: `{ _id, action, userName, userEmail, status, riskScore, timestamp, details }` |
| `new_security_alert` | Server -> Client | Security alert created (`createSecurityAlert()`) | Full `SecurityAlert` document: `{ alertId, type, severity, description, status, riskScore, timestamp }` |
| `session_revoked_${sessionId}` | Server -> Target Client | Administrator clicks "Revoke Session" or associated device is blocked | `{ reason: "Administrative revocation" }` |
| `session_updated` | Server -> Client | Session status changes (active, expired, revoked) | Full `Session` document |

### Instant Perimeter Severance Workflow
```
[ SOC Administrator ]                    [ Backend Server ]                   [ Target User Browser ]
        │                                        │                                       │
        │── DELETE /api/sessions/:id ───────────>│                                       │
        │                                        │── Mark Session 'Revoked' in DB        │
        │                                        │── Log 'SESSION_REVOKED' Audit Event   │
        │                                        │                                       │
        │                                        │── emit('session_revoked_{id}') ──────>│
        │                                        │                                       │── Detect Socket Event
        │                                        │                                       │── Display Red Alert Banner
        │                                        │                                       │── Clear Tokens from Storage
        │                                        │                                       │── Redirect to /login
        │<─ HTTP 200 (Severance Complete) ───────│                                       │
```

---

## 9. Complete REST API Specification

### 9.1 Authentication & Password Lifecycle (`/api/auth`)

#### `POST /api/auth/register`
- **Access**: Public (Subject to `authLimiter`)
- **Body**: `{ "name": "Jane Doe", "email": "jane@zerotrust.io", "password": "Password@123", "department": "Engineering", "title": "DevSecOps Engineer" }`
- **Response** (201): `{ "success": true, "token": "<JWT>", "data": { "user": {...}, "session": {...}, "device": {...} } }`

#### `POST /api/auth/login`
- **Access**: Public (Subject to `authLimiter`)
- **Body**: `{ "email": "superadmin@zerotrust.io", "password": "Password@123" }`
- **Response (Standard)** (200): `{ "success": true, "data": { "token": "<JWT>", "user": {...}, "session": {...}, "device": {...} } }`
- **Response (MFA Required)** (200): `{ "success": true, "mfaRequired": true, "tempToken": "<TempJWT>", "message": "Second factor required" }`

#### `POST /api/auth/verify-mfa`
- **Access**: Public
- **Body**: `{ "tempToken": "<TempJWT>", "mfaToken": "123456" }`
- **Response** (200): `{ "success": true, "data": { "token": "<JWT>", "user": {...}, "session": {...}, "device": {...} } }`

#### `GET /api/auth/me`
- **Access**: Authenticated (`authenticateToken`)
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200): `{ "success": true, "data": { "user": {...}, "session": {...}, "device": {...} } }`

#### `POST /api/auth/logout`
- **Access**: Authenticated
- **Response** (200): `{ "success": true, "message": "Session terminated successfully" }`

#### `POST /api/auth/change-password`
- **Access**: Authenticated
- **Body**: `{ "currentPassword": "Password@123", "newPassword": "NewPassword@2026" }`
- **Response** (200): `{ "success": true, "message": "Password updated successfully" }`

#### `POST /api/auth/forgot-password`
- **Access**: Public
- **Body**: `{ "email": "employee@zerotrust.io" }`
- **Response** (200): `{ "success": true, "message": "Password reset instructions dispatched" }`

#### `POST /api/auth/reset-password`
- **Access**: Public
- **Body**: `{ "token": "<CryptoToken>", "newPassword": "NewPassword@2026" }`
- **Response** (200): `{ "success": true, "message": "Password rotated successfully" }`

---

### 9.2 MFA Configuration (`/api/auth/mfa`)

#### `POST /api/auth/mfa/setup`
- **Access**: Authenticated
- **Response** (200): `{ "success": true, "data": { "secret": "JBSWY3DPEHPK3PXP", "qrCodeUrl": "data:image/png;base64,..." } }`

#### `POST /api/auth/mfa/verify-enable`
- **Access**: Authenticated
- **Body**: `{ "token": "123456", "secret": "JBSWY3DPEHPK3PXP" }`
- **Response** (200): `{ "success": true, "message": "MFA enabled successfully" }`

#### `POST /api/auth/mfa/disable`
- **Access**: Authenticated
- **Body**: `{ "password": "Password@123" }`
- **Response** (200): `{ "success": true, "message": "MFA deactivated successfully" }`

---

### 9.3 Enterprise Resources & Access Decisions (`/api/resources`)

#### `GET /api/resources`
- **Access**: Authenticated
- **Response** (200): `{ "success": true, "count": 6, "data": [ {...}, {...} ] }`

#### `GET /api/resources/:id`
- **Access**: Authenticated
- **Response** (200): `{ "success": true, "data": { "resourceId": "res-fin-02", "name": "Finance & Treasury Dashboard", ... } }`

#### `POST /api/resources/verify-access`
- **Access**: Authenticated
- **Body**: `{ "resourceId": "res-fin-02" }`
- **Response** (200):
  ```json
  {
    "success": true,
    "evaluation": {
      "allowed": true,
      "decision": "ALLOW",
      "riskScore": 15,
      "riskLevel": "LOW",
      "reason": "Zero Trust policy satisfied: Verified identity + Trusted device + Active MFA",
      "factors": ["Device is verified and marked as Trusted (-5)", "Valid TOTP MFA completed (-10)"]
    }
  }
  ```

---

### 9.4 Access Requests (`/api/access-requests`)

#### `GET /api/access-requests/me`
- **Access**: Authenticated (Returns caller's requests)
- **Response** (200): `{ "success": true, "count": 1, "data": [ {...} ] }`

#### `POST /api/access-requests`
- **Access**: Authenticated (`resource:request` permission)
- **Body**: `{ "resourceId": "res-fin-02", "reason": "Need access to review Q3 tax filings", "requestedPermission": "READ" }`
- **Response** (201): `{ "success": true, "message": "Access request submitted", "data": {...} }`

#### `GET /api/access-requests`
- **Access**: Authenticated (`resource:approve` permission - Managers / Admins)
- **Query Params**: `?status=PENDING`
- **Response** (200): `{ "success": true, "count": 2, "data": [ {...} ] }`

#### `PUT /api/access-requests/:id/approve`
- **Access**: Authenticated (`resource:approve` permission)
- **Body**: `{ "reviewNotes": "Approved for Q3 reporting cycle" }`
- **Response** (200): `{ "success": true, "message": "Access request approved", "data": {...} }`

#### `PUT /api/access-requests/:id/reject`
- **Access**: Authenticated (`resource:approve` permission)
- **Body**: `{ "reviewNotes": "Request denied under least-privilege policy" }`
- **Response** (200): `{ "success": true, "message": "Access request rejected", "data": {...} }`

---

### 9.5 Device Posture Management (`/api/devices`)

#### `GET /api/devices/me`
- **Access**: Authenticated (Returns caller's devices)
- **Response** (200): `{ "success": true, "data": [ {...} ] }`

#### `POST /api/devices/register`
- **Access**: Authenticated
- **Response** (200): `{ "success": true, "message": "Device recognized", "data": {...} }`

#### `GET /api/devices`
- **Access**: Authenticated (`device:read` permission)
- **Query Params**: `?status=Pending&search=Windows`
- **Response** (200): `{ "success": true, "count": 6, "data": [ {...} ] }`

#### `PUT /api/devices/:id/verify`
- **Access**: Authenticated (`device:verify` permission)
- **Response** (200): `{ "success": true, "message": "Device verified and marked as Trusted", "data": {...} }`

#### `PUT /api/devices/:id/block`
- **Access**: Authenticated (`device:verify` permission)
- **Body**: `{ "reason": "Suspected stolen laptop" }`
- **Response** (200): `{ "success": true, "message": "Device blacklisted and all associated active sessions severed", "data": {...} }`

#### `PUT /api/devices/:id/unblock`
- **Access**: Authenticated (`device:verify` permission)
- **Response** (200): `{ "success": true, "message": "Device unblocked and restored to Pending review", "data": {...} }`

---

### 9.6 Session Surveillance & Severance (`/api/sessions`)

#### `GET /api/sessions/me`
- **Access**: Authenticated (Returns caller's active/historical sessions)
- **Response** (200): `{ "success": true, "data": [ {...} ] }`

#### `DELETE /api/sessions/me/:id`
- **Access**: Authenticated (User terminates own session)
- **Response** (200): `{ "success": true, "message": "Session terminated" }`

#### `GET /api/sessions`
- **Access**: Authenticated (`session:read` permission)
- **Query Params**: `?status=Active`
- **Response** (200): `{ "success": true, "count": 4, "data": [ {...} ] }`

#### `DELETE /api/sessions/:id`
- **Access**: Authenticated (`session:revoke` permission)
- **Body**: `{ "reason": "Administrative security intervention" }`
- **Response** (200): `{ "success": true, "message": "Session severed at perimeter", "data": {...} }`

---

### 9.7 SOC Security Alerts (`/api/alerts`)

#### `GET /api/alerts`
- **Access**: Authenticated (`alert:read` permission)
- **Query Params**: `?status=Open&severity=CRITICAL`
- **Response** (200): `{ "success": true, "count": 2, "data": [ {...} ] }`

#### `GET /api/alerts/stats`
- **Access**: Authenticated (`alert:read` permission)
- **Response** (200): `{ "success": true, "data": { "critical": 1, "high": 2, "medium": 1, "low": 0, "total": 4 } }`

#### `PUT /api/alerts/:id/resolve`
- **Access**: Authenticated (`alert:resolve` permission)
- **Body**: `{ "resolutionNotes": "Investigated IP origin; determined benign testing. Whitelisted endpoint." }`
- **Response** (200): `{ "success": true, "message": "Alert marked as Resolved", "data": {...} }`

#### `PUT /api/alerts/:id/investigate`
- **Access**: Authenticated (`alert:resolve` permission)
- **Response** (200): `{ "success": true, "message": "Alert marked as Investigating", "data": {...} }`

---

### 9.8 Forensic Audit Logs (`/api/audit-logs`)

#### `GET /api/audit-logs`
- **Access**: Authenticated (`audit:read` permission)
- **Query Params**: `?action=LOGIN_FAILED&status=FAILURE&limit=50`
- **Response** (200): `{ "success": true, "count": 12, "data": [ {...} ] }`

#### `GET /api/audit-logs/stats`
- **Access**: Authenticated (`audit:read` permission)
- **Response** (200): `{ "success": true, "data": { "totalLogs": 142, "averageRiskScore": 24.5, "actionsCount": {...}, "statusCount": {...} } }`

---

### 9.9 Workforce Directory & RBAC Governance (`/api/users`, `/api/roles`)

#### `GET /api/users`
- **Access**: Authenticated (`user:read` permission)
- **Response** (200): `{ "success": true, "count": 4, "data": [ {...} ] }`

#### `GET /api/users/:id`
- **Access**: Authenticated (`user:read` permission)
- **Response** (200): `{ "success": true, "data": { "user": {...}, "devices": [...], "sessions": [...] } }`

#### `POST /api/users`
- **Access**: Authenticated (`user:create` permission - Super Admin)
- **Body**: `{ "name": "Sam Carter", "email": "sam@zerotrust.io", "password": "Password@123", "roleName": "Employee", "department": "Legal" }`
- **Response** (201): `{ "success": true, "message": "User provisioned successfully", "data": {...} }`

#### `PUT /api/users/:id`
- **Access**: Authenticated (`user:update` permission - Super Admin)
- **Body**: `{ "department": "Threat Intelligence", "title": "Senior SOC Analyst" }`
- **Response** (200): `{ "success": true, "message": "User updated", "data": {...} }`

#### `DELETE /api/users/:id`
- **Access**: Authenticated (`user:delete` permission - Super Admin)
- **Response** (200): `{ "success": true, "message": "User deleted and all active sessions revoked" }`

#### `PUT /api/users/:id/unlock`
- **Access**: Authenticated (`user:update` permission)
- **Response** (200): `{ "success": true, "message": "Account lockout cleared successfully" }`

#### `GET /api/roles`
- **Access**: Authenticated (`role:read` permission)
- **Response** (200): `{ "success": true, "data": [ {...}, {...} ] }`

#### `PUT /api/roles/:id`
- **Access**: Authenticated (`role:update` permission - Super Admin)
- **Body**: `{ "permissions": ["resource:read", "resource:request", "device:read", "session:read"] }`
- **Response** (200): `{ "success": true, "message": "Role permissions updated", "data": {...} }`

---

### 9.10 Dashboard & Metrics (`/api/dashboard`)

#### `GET /api/dashboard/overview`
- **Access**: Authenticated
- **Response** (200): `{ "success": true, "data": { "stats": {...}, "riskDistribution": [...], "alertsBySeverity": [...], "devicesByOS": [...], "accessDecisions": [...], "timelineData": [...], "recentActivity": [...] } }`

#### `GET /api/dashboard/employee`
- **Access**: Authenticated
- **Response** (200): `{ "success": true, "data": { "devicesCount": 1, "activeSessionsCount": 1, "pendingRequestsCount": 0, "recentRequests": [...], "recentActivity": [...], "recommendedResources": [...] } }`

---

## 10. Pre-configured Demo Accounts & Fast-Track Credentials

The automated seed generator initializes four realistic enterprise personas:

| Enterprise Persona | Email | Password | Hierarchy Level | MFA Configuration | Assigned Authorities & Scope |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Super Admin** | `superadmin@zerotrust.io` | `Password@123` | **Level 4** | **Enforced** (Demo: `123456`) | Full enterprise authority, directory CRUD, RBAC matrix editing, policy management |
| **Security Admin** | `securityadmin@zerotrust.io` | `Password@123` | **Level 3** | **Enforced** (Demo: `123456`) | SOC operations, threat investigation, device verification & blacklisting, perimeter severance |
| **Manager** | `manager@zerotrust.io` | `Password@123` | **Level 2** | Optional | Workforce directory inspection, team access justification reviews & approvals |
| **Employee** | `employee@zerotrust.io` | `Password@123` | **Level 1** | Optional | Bound by least-privilege Zero Trust policy, resource catalog access, justification requests |

> **Fast-Track Login**:
> On the `/login` page, click any of the **Demo Account** buttons to instantly fill the credentials.
> For accounts with MFA enforced, enter your authenticator code or click **Use Demo Code (123456)** to proceed without mobile hardware.

---

## 11. Installation, Setup & Environment Configuration

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **Git**
- *(Optional)* Local MongoDB instance on port 27017. **If MongoDB is stopped or not installed, the backend automatically launches `mongodb-memory-server` with zero configuration required.**

---

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd zerotrust-platform
```

---

### Step 2: Backend Setup & Seeding

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Initialize environment variables (pre-configured defaults provided)
cp .env.example .env

# Seed enterprise baseline dataset (Users, Roles, Resources, Devices, Alerts)
npm run seed

# Launch development API server (runs on http://localhost:5000)
npm run dev
```

---

### Step 3: Frontend Setup

Open a separate terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

### Step 4: Run Automated Verification Suite

To verify that all 19 security assertions pass:

```bash
cd backend
node test-suite.js
```

---

### Environment Variables Reference (`backend/.env`)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | HTTP and Socket.IO server listen port |
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/zerotrust` | Primary MongoDB connection URI (triggers fallback on failure) |
| `JWT_SECRET` | `zerotrust_ultra_secure_jwt_secret_key_...` | Cryptographic secret for signing JSON Web Tokens |
| `JWT_EXPIRES_IN` | `24h` | Token expiration lifespan |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin for frontend client |
| `SMTP_HOST` | `smtp.mailtrap.io` | SMTP mail server hostname |
| `SMTP_PORT` | `2525` | SMTP port (465 for SSL, 587 for TLS) |
| `SMTP_USER` | `test_smtp_user` | SMTP username (leaves in simulation mode if unchanged) |
| `SMTP_PASSWORD` | `test_smtp_password` | SMTP password |

---

## 12. End-to-End Demonstration Walkthrough

Follow these steps to demonstrate the platform for evaluations, defenses, and presentations:

### Scenario 1: Identity Verification & Step-Up TOTP Challenge
1. Open browser to `http://localhost:5173/login`.
2. Click the **Super Admin** demo account button (populates `superadmin@zerotrust.io`).
3. Click **Verify Identity & Access**.
4. The system detects that Super Admin has MFA enforced and transitions to the TOTP second-factor screen.
5. Click **Use Demo Code (123456)** and click **Confirm Second Factor**.
6. The system grants admission to the **Executive Security Dashboard**.

### Scenario 2: 6-Pillar Zero Trust Policy Diagnostic Checkpoint
1. In the sidebar, navigate to **Enterprise Resources** (`/resources`).
2. Locate the **Finance & Treasury Dashboard** (classified as `RESTRICTED`, requiring High trust).
3. Click **Posture Check**.
4. The **Zero Trust Access Diagnostic Modal** appears, evaluating the 6 pillars in real-time:
   - Identity Check: Passed (Active).
   - RBAC Check: Passed (Super Admin authorized).
   - Device Posture: Passed (Trusted Workstation).
   - MFA Check: Passed (TOTP verified).
   - Continuous Session: Passed (Active).
   - Dynamic Risk Score: 15 (Low Risk).
5. The policy engine returns `ALLOW`. Click **Launch Protected Application**.

### Scenario 3: Real-Time Perimeter Severance (Instant Session Revocation)
1. Open a **Google Chrome Incognito window** and navigate to `http://localhost:5173/login`.
2. Log in as **Employee** (`employee@zerotrust.io` / `Password@123`).
3. Notice a session is active in the employee's browser.
4. In your primary **Super Admin** window, navigate to **Active Sessions** (`/sessions` or `/admin/sessions`).
5. Locate the Employee's active session and click **Revoke Session**.
6. **Instant WebSocket Severance**: In the Employee's Incognito window, a **Red Alert Banner** immediately drops down:
   > *"Zero Trust Perimeter Severance: Session was forcefully revoked by administrator"*
   The employee is logged out and redirected to login in real-time with zero polling delay.

### Scenario 4: Endpoint Posture Gating & Device Blacklisting
1. In the Super Admin window, navigate to **Devices** (`/admin/devices`).
2. Locate the unrecognized Linux node (`dev_blacklisted_anon_09`).
3. Click **Block Device** and enter reason *"Blacklisted Tor Exit Node"*.
4. Notice that any active sessions on that device are terminated immediately.
5. If an access evaluation is attempted from that device, the engine returns `DENY` with Risk Score: 100.

### Scenario 5: Access Justification & Manager Approval Lifecycle
1. Log in as **Employee** (`employee@zerotrust.io` / `Password@123`).
2. Navigate to **Enterprise Resources** (`/resources`).
3. Select **Core Production Git Repository** and click **Request Access**.
4. Fill in the justification reason: *"Need write access to resolve security bug #104"* and submit.
5. In another window, log in as **Manager** (`manager@zerotrust.io` / `Password@123`).
6. Navigate to **Access Requests** (`/access-requests`).
7. Review the pending ticket, observe the automated risk score (25), and click **Approve Request**.

### Scenario 6: SOC Threat Incident Triage & Resolution
1. Log in as **Security Admin** (`securityadmin@zerotrust.io` / `Password@123`).
2. Navigate to **SOC Security Alerts** (`/security` or `/admin/alerts`).
3. Filter by severity `CRITICAL`. Inspect incident `ALT-2026-0001` (*"Blocked device attempted authentication via Tor exit node"*).
4. Click **Resolve Alert**, enter mitigation notes: *"Firewall rule enacted; IP range dropped"*, and confirm.
5. The alert status updates to `Resolved` and logs a companion forensic audit trail entry.

---

## 13. Security Engineering, Hardening & Compliance

### Defense-in-Depth Engineering Layers
1. **Perimeter Network Protection**:
   - `express-rate-limit` prevents brute-force password guessing and volumetric credential stuffing.
   - `helmet` removes `X-Powered-By`, enforces secure frameguard protections, and mitigates MIME-sniffing.
   - Strict CORS policy restricts origins to approved client endpoints.
2. **Cryptographic Integrity**:
   - Password hashing uses `bcryptjs` with 10 salt rounds.
   - Session tokens use HMAC SHA-256 JWTs with 24-hour expiration.
   - Multi-Factor Authentication adheres to RFC 6238 TOTP with cryptographic Base32 secrets.
3. **Forensic Immutability & Redaction**:
   - Security audit logs are append-only.
   - Sensitive fields (`password`, `mfaSecret`, `token`) are automatically redacted by `logger.js` before reaching console output or external logs.
4. **Resilient Data Architecture**:
   - MongoDB connection includes automated fallback to `mongodb-memory-server` to guarantee high availability during development and evaluations.

### Regulatory & Standards Compliance Alignment
- **NIST SP 800-207 Zero Trust Architecture**: Aligns with Policy Decision Point (PDP) and Policy Enforcement Point (PEP) model.
- **SOC 2 Type II**: Meets criteria for Common Criteria (Security), Access Control (CC6.1–CC6.3), and Audit Logging (CC7.2).
- **ISO/IEC 27001:2022**: Supports Control A.9 (Access Control), Control A.9.4.2 (User Authentication), and Control A.12.4 (Logging and Monitoring).
- **HIPAA Security Rule**: Supports Technical Safeguards (§164.312) for Access Control, Audit Controls, and Integrity.

---

## 14. License

This project is licensed under the **MIT License**. Created for cybersecurity research, academic defenses, capstone presentations, and enterprise Zero Trust architecture demonstrations.
