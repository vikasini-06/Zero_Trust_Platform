import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import {
  Activity,
  LogOut,
  ShieldAlert,
  Clock,
  Globe,
  Laptop,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SecurityBadge from '../components/SecurityBadge';
import RiskBadge from '../components/RiskBadge';

export const Sessions = () => {
  const { user } = useAuth();
  const isAdminOrSoc = user?.roleName === 'Super Admin' || user?.roleName === 'Security Admin';

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const url = isAdminOrSoc ? '/sessions' : '/sessions/me';
      const res = await api.get(url);
      if (res.success) setSessions(res.data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [isAdminOrSoc]);

  const handleRevoke = async (sessionId) => {
    if (!window.confirm(`Forcefully terminate session [${sessionId}]?`)) return;

    try {
      const endpoint = isAdminOrSoc ? `/sessions/${sessionId}` : `/sessions/me/${sessionId}`;
      const res = await api.delete(endpoint, {
        data: { reason: 'Revoked by user/administrator via portal' },
      });

      if (res.success) {
        fetchSessions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Revocation failed');
    }
  };

  const columns = [
    {
      header: 'Session Token / ID',
      accessor: 'sessionId',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{row.sessionId.substring(0, 16)}...</span>
            {row.isCurrent && (
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded font-semibold">
                This Device
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500">{row.deviceId}</span>
        </div>
      ),
    },
    {
      header: 'Identity',
      accessor: 'user',
      render: (row) => (
        <div>
          <p className="text-white font-medium">{row.user?.name || user?.name}</p>
          <span className="text-[11px] font-mono text-cyan-400">
            {row.user?.email || user?.email}
          </span>
        </div>
      ),
    },
    {
      header: 'Client Context & IP',
      accessor: 'ipAddress',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="text-slate-300">{row.ipAddress}</div>
          <div className="text-[11px] text-slate-500">{row.location}</div>
        </div>
      ),
    },
    {
      header: 'Heartbeat / Last Active',
      accessor: 'lastActivity',
      render: (row) => (
        <div className="font-mono text-xs text-slate-300">
          <div>{new Date(row.lastActivity).toLocaleTimeString()}</div>
          <div className="text-[10px] text-slate-500">
            Login: {new Date(row.loginTime).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Posture Status',
      accessor: 'status',
      render: (row) => <SecurityBadge status={row.status} size="sm" />,
    },
    {
      header: 'Continuous Risk',
      accessor: 'riskScore',
      render: (row) => <RiskBadge score={row.riskScore} />,
    },
    {
      header: 'Control',
      accessor: '_id',
      render: (row) => {
        if (row.status !== 'Active') {
          return <span className="text-xs text-slate-500 font-mono">Terminated</span>;
        }

        return (
          <button
            onClick={() => handleRevoke(row.sessionId)}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Revoke</span>
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-cyan-400" /> Continuous Session Monitoring
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-Time Token Telemetry & Immediate Perimeter Revocation
          </p>
        </div>

        <button
          onClick={fetchSessions}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Refresh active sessions"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <DataTable
        columns={columns}
        data={sessions}
        loading={loading}
        searchKey="sessionId"
        searchPlaceholder="Filter sessions by ID, user, or IP..."
      />
    </div>
  );
};

export default Sessions;
