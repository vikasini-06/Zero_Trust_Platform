import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Clock,
  User,
  Smartphone,
  Globe,
} from 'lucide-react';
import SecurityBadge from '../components/SecurityBadge';
import RiskBadge from '../components/RiskBadge';

export const Security = () => {
  const { socket } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alerts');
      if (res.success) setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load security alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    if (socket) {
      socket.on('new_security_alert', (newAlert) => {
        setAlerts((prev) => [newAlert, ...prev]);
      });
    }

    return () => {
      if (socket) {
        socket.off('new_security_alert');
      }
    };
  }, [socket]);

  const handleResolve = async (id, alertId) => {
    const resolutionNotes = window.prompt(`Enter resolution finding for [${alertId}]:`, 'Threat investigated and mitigated by SOC team.');
    if (!resolutionNotes) return;

    try {
      const res = await api.put(`/alerts/${id}/resolve`, { resolutionNotes });
      if (res.success) fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Resolution update failed');
    }
  };

  const handleInvestigate = async (id) => {
    try {
      const res = await api.put(`/alerts/${id}/investigate`);
      if (res.success) fetchAlerts();
    } catch (err) {}
  };

  const filtered = alerts.filter((alt) => {
    const matchesSev = severityFilter === 'ALL' || alt.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || alt.status === statusFilter;
    const matchesSearch =
      alt.description.toLowerCase().includes(search.toLowerCase()) ||
      alt.alertId.toLowerCase().includes(search.toLowerCase()) ||
      (alt.userName && alt.userName.toLowerCase().includes(search.toLowerCase())) ||
      (alt.ipAddress && alt.ipAddress.includes(search));
    return matchesSev && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-amber-400" /> Security Operations Center (SOC) Alerts
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-Time Anomaly Triage, Behavioral Surveillance, & Threat Containment
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Refresh Alerts"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts, IPs, accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-mono text-xs">
          <span className="text-slate-500 text-[11px] mr-1">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                severityFilter === sev
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-mono text-xs">
          Scanning SOC telemetry stream...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-500 font-mono text-xs">
          No active security incidents match your filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((alert) => (
            <div
              key={alert._id}
              className={`glass-panel rounded-2xl p-5 border transition-all ${
                alert.status === 'Resolved'
                  ? 'border-slate-800/60 opacity-60'
                  : alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
                  ? 'border-rose-500/40 glow-rose'
                  : 'border-amber-500/30 glow-amber'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {alert.alertId}
                    </span>
                    <SecurityBadge status={alert.severity} size="sm" />
                    <SecurityBadge status={alert.status} size="sm" />
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {alert.description}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">{alert.userName || alert.userEmail || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">{alert.deviceId || 'Endpoint N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">{alert.ipAddress}</span>
                    </div>
                  </div>

                  {alert.mitigationAction && (
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-cyan-300 mt-2">
                      <span className="text-slate-400 font-semibold mr-1">Mitigation:</span>
                      {alert.mitigationAction}
                    </div>
                  )}

                  {alert.resolutionNotes && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 mt-2">
                      <span className="text-emerald-400 font-semibold mr-1">Resolution Finding:</span>
                      {alert.resolutionNotes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {alert.status !== 'Resolved' && (
                  <div className="flex sm:flex-col items-center gap-2 self-end sm:self-auto font-mono text-xs">
                    {alert.status === 'Open' && (
                      <button
                        onClick={() => handleInvestigate(alert._id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Triage</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleResolve(alert._id, alert.alertId)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-semibold transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Resolve</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Security;
