import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Eye,
  RefreshCw,
  Search,
  Clock,
  User,
  Smartphone,
  Globe,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import SecurityBadge from '../components/SecurityBadge';
import RiskBadge from '../components/RiskBadge';

export const Alerts = () => {
  const { socket } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Resolution Modal State
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

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

  const handleOpenResolve = (alertItem) => {
    setSelectedAlert(alertItem);
    setResolutionNotes('Threat mitigated following SOC perimeter verification procedure.');
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;

    setResolving(true);
    try {
      const res = await api.put(`/alerts/${selectedAlert._id}/resolve`, {
        resolutionNotes,
      });

      if (res.success) {
        setSelectedAlert(null);
        fetchAlerts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Resolution failed');
    } finally {
      setResolving(false);
    }
  };

  const handleInvestigate = async (id) => {
    try {
      const res = await api.put(`/alerts/${id}/investigate`);
      if (res.success) fetchAlerts();
    } catch (err) {
      console.error('Investigate error:', err);
    }
  };

  const counts = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'Resolved').length,
    high: alerts.filter((a) => a.severity === 'HIGH' && a.status !== 'Resolved').length,
    open: alerts.filter((a) => a.status === 'Open').length,
    resolved: alerts.filter((a) => a.status === 'Resolved').length,
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Active Incidents</span>
          <div className="text-2xl font-black text-white">{counts.open}</div>
          <span className="text-[10px] text-amber-400 font-mono">Requires Attention</span>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Critical Severity</span>
          <div className="text-2xl font-black text-rose-400">{counts.critical}</div>
          <span className="text-[10px] text-rose-500 font-mono">Perimeter Severance</span>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">High Severity</span>
          <div className="text-2xl font-black text-amber-400">{counts.high}</div>
          <span className="text-[10px] text-slate-400 font-mono">Investigation Active</span>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Resolved Incidents</span>
          <div className="text-2xl font-black text-emerald-400">{counts.resolved}</div>
          <span className="text-[10px] text-emerald-500 font-mono">Remediated by SOC</span>
        </div>
      </div>

      {/* Filters Toolbar */}
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
          <div className="flex items-center gap-1 mr-3">
            <span className="text-slate-500 text-[11px] mr-1">Status:</span>
            {['ALL', 'Open', 'Investigating', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  statusFilter === st
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px] mr-1">Severity:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-1 rounded-xl transition-all text-[11px] ${
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
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-mono text-xs">
          Scanning SOC telemetry stream...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-500 font-mono text-xs">
          No security alerts match the selected criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((alert) => (
            <div
              key={alert._id}
              className={`glass-panel p-5 rounded-2xl border transition-all ${
                alert.severity === 'CRITICAL'
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : alert.severity === 'HIGH'
                  ? 'border-amber-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-500 text-black'
                          : alert.severity === 'HIGH'
                          ? 'bg-amber-500 text-black'
                          : alert.severity === 'MEDIUM'
                          ? 'bg-yellow-500 text-black'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {alert.severity}
                    </span>

                    <span className="font-mono text-xs text-slate-400 font-bold">
                      [{alert.alertId}]
                    </span>

                    <span className="font-mono text-xs text-cyan-400">
                      {alert.type}
                    </span>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        alert.status === 'Resolved'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : alert.status === 'Investigating'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      ● {alert.status}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-white">
                    {alert.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {alert.userName || 'Unknown'} ({alert.userEmail || 'N/A'})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      IP: {alert.ipAddress}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {alert.mitigationAction && (
                    <div className="text-[11px] font-mono text-cyan-300/80 bg-cyan-950/20 border border-cyan-500/20 p-2 rounded-lg mt-2">
                      <strong className="text-cyan-400">SOC Automated Defense: </strong>
                      {alert.mitigationAction}
                    </div>
                  )}

                  {alert.status === 'Resolved' && alert.resolutionNotes && (
                    <div className="text-[11px] font-mono text-emerald-300/80 bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-lg mt-2">
                      <strong className="text-emerald-400">Resolution Finding: </strong>
                      {alert.resolutionNotes}
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col items-center justify-end gap-2 flex-shrink-0">
                  <RiskBadge score={alert.riskScore} />

                  {alert.status !== 'Resolved' && (
                    <div className="flex items-center gap-2 mt-2">
                      {alert.status === 'Open' && (
                        <button
                          onClick={() => handleInvestigate(alert._id)}
                          className="px-3 py-1.5 rounded-xl border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-mono transition-colors"
                        >
                          Investigate
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenResolve(alert)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/15"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 border border-slate-800 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-bold text-base">Resolve Security Incident</h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div className="text-xs text-slate-300">
                Resolving alert <strong>[{selectedAlert.alertId}]</strong>: {selectedAlert.description}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase">
                  SOC Resolution Findings & Mitigation Notes
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono transition-all disabled:opacity-50"
                >
                  {resolving ? 'Recording...' : 'Confirm Incident Cleared'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
