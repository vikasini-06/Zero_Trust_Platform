import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SecurityBadge from '../components/SecurityBadge';
import RiskBadge from '../components/RiskBadge';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (actionFilter) params.action = actionFilter;

      const res = await api.get('/audit-logs', { params });
      if (res.success) setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, actionFilter]);

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {new Date(row.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Action / Event',
      accessor: 'action',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-white tracking-wide">
          {row.action}
        </span>
      ),
    },
    {
      header: 'Identity',
      accessor: 'userName',
      render: (row) => (
        <div>
          <p className="text-white font-medium">{row.userName}</p>
          <span className="text-[11px] font-mono text-cyan-400">{row.userEmail}</span>
        </div>
      ),
    },
    {
      header: 'Context & IP',
      accessor: 'ipAddress',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="text-slate-300">{row.ipAddress}</div>
          <div className="text-[10px] text-slate-500">{row.deviceId || '—'}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <SecurityBadge status={row.status} size="sm" />,
    },
    {
      header: 'Risk Score',
      accessor: 'riskScore',
      render: (row) => <RiskBadge score={row.riskScore} />,
    },
    {
      header: 'Details',
      accessor: '_id',
      render: (row) => (
        <button
          onClick={() => setSelectedLog(row)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Inspect Payload"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-cyan-400" /> Immutable Security Audit Trail
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Zero Trust Continuous Ledger: Non-repudiable Append-Only Log of Security Events
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Refresh Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Row */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
            <option value="WARNING">WARNING</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="MFA_SUCCESS">MFA_SUCCESS</option>
            <option value="MFA_FAILED">MFA_FAILED</option>
            <option value="DEVICE_VERIFIED">DEVICE_VERIFIED</option>
            <option value="DEVICE_BLOCKED">DEVICE_BLOCKED</option>
            <option value="ACCESS_GRANTED">ACCESS_GRANTED</option>
            <option value="ACCESS_DENIED">ACCESS_DENIED</option>
            <option value="SESSION_REVOKED">SESSION_REVOKED</option>
            <option value="SECURITY_ALERT_CREATED">SECURITY_ALERT_CREATED</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        searchKey="action"
        searchPlaceholder="Filter logs by action, username, IP, or ID..."
      />

      {/* Inspect Audit Log Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl glass-panel border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Audit Record: {selectedLog.action}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-mono text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-slate-500">Event ID:</span>
                  <p className="text-slate-300 font-bold">{selectedLog._id}</p>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp:</span>
                  <p className="text-slate-300">{new Date(selectedLog.timestamp).toISOString()}</p>
                </div>
                <div>
                  <span className="text-slate-500">Actor Identity:</span>
                  <p className="text-cyan-400">{selectedLog.userEmail}</p>
                </div>
                <div>
                  <span className="text-slate-500">Target Resource:</span>
                  <p className="text-slate-300">{selectedLog.resource}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] block mb-1">
                  Cryptographic Details & Context Payload:
                </span>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 overflow-x-auto text-[11px] leading-relaxed">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
