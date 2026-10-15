import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import {
  Smartphone,
  CheckCircle,
  Ban,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Laptop,
  Monitor,
  Tablet,
  Globe,
  Clock,
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SecurityBadge from '../components/SecurityBadge';
import RiskBadge from '../components/RiskBadge';

export const Devices = () => {
  const { user } = useAuth();
  const isAdminOrSoc = user?.roleName === 'Super Admin' || user?.roleName === 'Security Admin';

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const url = isAdminOrSoc ? '/devices' : '/devices/me';
      const res = await api.get(url);
      if (res.success) setDevices(res.data);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [isAdminOrSoc]);

  const handleVerify = async (deviceId, name) => {
    if (!window.confirm(`Verify and mark device [${name}] as Trusted?`)) return;
    try {
      const res = await api.put(`/devices/${deviceId}/verify`);
      if (res.success) fetchDevices();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleBlock = async (deviceId, name) => {
    const reason = window.prompt(`Specify reason for blocking device [${name}]:`, 'Anomalous posture / unauthorized hardware');
    if (!reason) return;
    try {
      const res = await api.put(`/devices/${deviceId}/block`, { reason });
      if (res.success) fetchDevices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to block device');
    }
  };

  const handleUnblock = async (deviceId, name) => {
    if (!window.confirm(`Unblock device [${name}] and reset status to Pending?`)) return;
    try {
      const res = await api.put(`/devices/${deviceId}/unblock`);
      if (res.success) fetchDevices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unblock device');
    }
  };

  const filteredDevices = devices.filter((d) => {
    if (statusFilter === 'ALL') return true;
    return d.status?.toUpperCase() === statusFilter;
  });

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'Desktop':
        return <Monitor className="w-4 h-4 text-cyan-400" />;
      case 'Mobile':
        return <Smartphone className="w-4 h-4 text-cyan-400" />;
      case 'Tablet':
        return <Tablet className="w-4 h-4 text-cyan-400" />;
      default:
        return <Laptop className="w-4 h-4 text-cyan-400" />;
    }
  };

  const columns = [
    {
      header: 'Endpoint / Hardware',
      accessor: 'deviceName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
            {getDeviceIcon(row.deviceType)}
          </div>
          <div>
            <p className="font-semibold text-white">{row.deviceName}</p>
            <span className="text-[10px] font-mono text-slate-400">{row.deviceId}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Owner',
      accessor: 'user',
      render: (row) => (
        <div>
          <p className="text-white font-medium">{row.user?.name || user?.name}</p>
          <span className="text-[10px] font-mono text-cyan-400">
            {row.user?.email || user?.email}
          </span>
        </div>
      ),
    },
    {
      header: 'OS & Browser',
      accessor: 'os',
      render: (row) => (
        <div className="font-mono text-xs text-slate-300">
          <div>{row.os}</div>
          <div className="text-[11px] text-slate-500">{row.browser}</div>
        </div>
      ),
    },
    {
      header: 'IP & Geolocation',
      accessor: 'ipAddress',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="text-slate-300">{row.ipAddress}</div>
          <div className="text-[10px] text-slate-500">{row.location}</div>
        </div>
      ),
    },
    {
      header: 'Posture Status',
      accessor: 'status',
      render: (row) => <SecurityBadge status={row.status} size="sm" />,
    },
    {
      header: 'Risk Score',
      accessor: 'riskScore',
      render: (row) => <RiskBadge score={row.riskScore} />,
    },
    {
      header: 'Last Seen',
      accessor: 'lastActive',
      render: (row) => (
        <span className="text-xs font-mono text-slate-400">
          {new Date(row.lastActive).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'SOC Controls',
      accessor: '_id',
      render: (row) => {
        if (!isAdminOrSoc) return <span className="text-xs text-slate-500 font-mono">—</span>;

        return (
          <div className="flex items-center gap-1.5 font-mono">
            {row.status !== 'Trusted' && row.status !== 'Blocked' && (
              <button
                onClick={() => handleVerify(row._id, row.deviceName)}
                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs transition-all"
                title="Verify and Trust Device"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}

            {row.status !== 'Blocked' ? (
              <button
                onClick={() => handleBlock(row._id, row.deviceName)}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs transition-all"
                title="Block Device & Sever Active Sessions"
              >
                <Ban className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => handleUnblock(row._id, row.deviceName)}
                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs transition-all"
                title="Unblock Device"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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
            <Smartphone className="w-6 h-6 text-cyan-400" /> Endpoint Device Posture Inventory
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Zero Trust Device Identity & Hardware Verification Ledger
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'TRUSTED', 'PENDING', 'BLOCKED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredDevices}
        loading={loading}
        searchKey="deviceName"
        searchPlaceholder="Filter devices by name, ID, or IP..."
      />
    </div>
  );
};

export default Devices;
