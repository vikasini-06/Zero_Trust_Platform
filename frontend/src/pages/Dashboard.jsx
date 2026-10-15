import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import {
  Users,
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  Smartphone,
  Lock,
  ArrowUpRight,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import SecurityBadge from '../components/SecurityBadge';
import RiskBadge from '../components/RiskBadge';
import ZeroTrustModal from '../components/ZeroTrustModal';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { user, socket } = useAuth();
  const isPrivileged = user?.roleName === 'Super Admin' || user?.roleName === 'Security Admin' || user?.roleName === 'Manager';

  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);

  // Zero Trust Access Modal
  const [selectedResource, setSelectedResource] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      if (isPrivileged) {
        const res = await api.get('/dashboard/overview');
        if (res.success) setStatsData(res.data);
      } else {
        const res = await api.get('/dashboard/employee');
        if (res.success) setEmployeeData(res.data);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);

    let refreshTimer = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        fetchDashboardData(false);
      }, 1500);
    };

    if (socket) {
      socket.on('new_audit_log', scheduleRefresh);
      socket.on('new_security_alert', scheduleRefresh);
    }

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      if (socket) {
        socket.off('new_audit_log', scheduleRefresh);
        socket.off('new_security_alert', scheduleRefresh);
      }
    };
  }, [socket, isPrivileged]);

  const handleLaunchResource = (resource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-xs font-mono text-cyan-400">Loading Zero Trust telemetry...</p>
      </div>
    );
  }

  // ================= ADMIN & MANAGER SOC DASHBOARD =================
  if (isPrivileged && statsData) {
    const { stats, riskDistribution, alertsBySeverity, timelineData, recentActivity, accessDecisions } = statsData;

    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Enterprise Security Operations Center
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Role: <span className="text-cyan-400 font-semibold">{user?.roleName}</span> • Continuous Context Verification & Adaptive Authorization
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/security"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs text-white font-mono flex items-center gap-2 transition-all"
            >
              <span>SOC Alert Feed</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
            </Link>
            <Link
              to="/admin/audit-logs"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all shadow-lg shadow-cyan-500/20"
            >
              Audit Trail
            </Link>
          </div>
        </div>

        {/* 6 Key Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            subtext="Enrolled identities"
            icon={Users}
            color="cyan"
          />
          <StatCard
            title="Active Sessions"
            value={stats.activeSessions}
            subtext="Live continuous tokens"
            icon={Activity}
            color="green"
          />
          <StatCard
            title="Trusted Endpoints"
            value={stats.trustedDevices}
            subtext={`${stats.pendingDevices} pending approval`}
            icon={ShieldCheck}
            color="cyan"
          />
          <StatCard
            title="Suspicious / Blocked"
            value={stats.suspiciousDevices + stats.blockedDevices}
            subtext="Quarantined perimeter"
            icon={ShieldAlert}
            color="rose"
          />
          <StatCard
            title="Open Alerts"
            value={stats.openAlerts}
            subtext="Actionable threats"
            icon={AlertTriangle}
            color="amber"
          />
          <StatCard
            title="Access Requests"
            value={stats.pendingAccessRequests}
            subtext="Awaiting review"
            icon={FileCheck}
            color="purple"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline Activity Chart */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Authentication & Security Events Timeline
                </h3>
                <p className="text-xs text-slate-400">7-Day Continuous Monitoring Trend</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Live Data
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="logins"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLogins)"
                    name="Successful Auth"
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFailed)"
                    name="Failed Attempts"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Score Distribution Pie */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Risk Score Distribution
              </h3>
              <p className="text-xs text-slate-400">Continuous Endpoint Posture</p>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              {riskDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-2 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.name}
                  </span>
                  <span className="text-white font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Alerts Severity & Live Activity Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Alerts by Severity Bar Chart */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Threats By Severity
              </h3>
              <p className="text-xs text-slate-400">Open Incidents in SOC Triage</p>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertsBySeverity}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {alertsBySeverity.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Real-time Audit Stream */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Real-time Security Audit Stream
                </h3>
                <p className="text-xs text-slate-400">Continuous Append-Only Event Log</p>
              </div>
              <Link to="/admin/audit-logs" className="text-xs font-mono text-cyan-400 hover:underline">
                View All Logs →
              </Link>
            </div>

            <div className="space-y-2.5 overflow-hidden">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 6).map((log, idx) => (
                  <div
                    key={log._id || idx}
                    className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {log.status === 'SUCCESS' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : log.status === 'BLOCKED' || log.status === 'FAILURE' ? (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-white mr-2">{log.action}</span>
                        <span className="text-slate-400">{log.userName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <SecurityBadge status={log.status} size="sm" />
                      <span className="text-[11px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-8">No security events recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= EMPLOYEE PERSONAL DASHBOARD =================
  if (employeeData) {
    const { user: empUser, securityStatus, myDevices, mySessions, myRequests, availableResources } = employeeData;

    return (
      <div className="space-y-6">
        {/* Welcome & Posture Banner */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Personal Zero Trust Enclave
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {empUser?.name}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Identity: <span className="text-slate-300 font-semibold">{empUser?.email}</span> • Department: {empUser?.department}
            </p>
          </div>

          {/* Posture Score Pill */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-slate-800 border-t-cyan-400 flex items-center justify-center font-mono font-bold text-lg text-white">
                {securityStatus.postureScore}%
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-slate-400">Account Posture</p>
              <h4 className="text-sm font-bold text-white">Health Score: Excellent</h4>
              <p className="text-xs text-slate-400 font-mono">Risk Level: {securityStatus.overallRisk}</p>
            </div>
          </div>
        </div>

        {/* 4 Security Posture Checkpoints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" /> Multi-Factor (TOTP)
              </span>
              <SecurityBadge status={empUser?.mfaEnabled ? 'TRUSTED' : 'WARNING'} size="sm" />
            </div>
            <p className="text-white font-semibold">
              {empUser?.mfaEnabled ? 'Protected with 2FA' : 'MFA Not Configured'}
            </p>
            {!empUser?.mfaEnabled && (
              <Link to="/mfa-setup" className="text-cyan-400 hover:underline text-[11px] block mt-1">
                Enable Authenticator →
              </Link>
            )}
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" /> Endpoint Trust
              </span>
              <SecurityBadge status={securityStatus.devicePosture} size="sm" />
            </div>
            <p className="text-white font-semibold">{myDevices.length} Hardware Profile(s)</p>
            <Link to="/devices" className="text-cyan-400 hover:underline text-[11px] block mt-1">
              Inspect Devices →
            </Link>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Active Sessions
              </span>
              <SecurityBadge status="ACTIVE" size="sm" />
            </div>
            <p className="text-white font-semibold">{mySessions.length} Live Session Token(s)</p>
            <Link to="/sessions" className="text-cyan-400 hover:underline text-[11px] block mt-1">
              Manage Sessions →
            </Link>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Continuous Guard
              </span>
              <SecurityBadge status="ACTIVE" size="sm" />
            </div>
            <p className="text-white font-semibold">CADC Checkpoint</p>
            <span className="text-slate-500 text-[11px] block mt-1">Perimeter Verification</span>
          </div>
        </div>

        {/* Enterprise Applications with Zero Trust Checkpoint Launcher */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Available Enterprise Applications
              </h3>
              <p className="text-xs text-slate-400">
                Click any application to trigger the live Zero Trust Verification Checkpoint
              </p>
            </div>
            <Link to="/resources" className="text-xs font-mono text-cyan-400 hover:underline">
              Catalog View →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableResources && availableResources.map((res) => (
              <div
                key={res._id || res.resourceId}
                className="glass-panel glass-panel-hover p-4 rounded-2xl border border-slate-800/80 space-y-3 relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    {res.classification}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                    {res.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{res.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">{res.category}</span>
                  <button
                    onClick={() => handleLaunchResource(res)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all flex items-center gap-1.5"
                  >
                    <span>Launch</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Access Requests */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-wide">
              My Resource Access Requests
            </h3>
            <Link to="/access-requests" className="text-xs font-mono text-cyan-400 hover:underline">
              Submit New Request →
            </Link>
          </div>

          <div className="space-y-2.5">
            {myRequests && myRequests.length > 0 ? (
              myRequests.map((req) => (
                <div
                  key={req._id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{req.resourceName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {req.requestedPermission}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{req.reason}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <RiskBadge score={req.riskScore} />
                    <SecurityBadge status={req.status} size="sm" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6 font-mono">
                No active access requests. Access is granted on-demand according to least-privilege.
              </p>
            )}
          </div>
        </div>

        {/* Zero Trust Evaluation Checkpoint Modal */}
        <ZeroTrustModal
          resource={selectedResource}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    );
  }

  return null;
};

export default Dashboard;
