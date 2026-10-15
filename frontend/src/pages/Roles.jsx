import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Layers, ShieldCheck, Check, Save, Info, CheckCircle2 } from 'lucide-react';

const PERMISSION_GROUPS = [
  {
    title: 'User Management',
    permissions: [
      { key: 'user:read', label: 'View users & directory' },
      { key: 'user:create', label: 'Provision new identities' },
      { key: 'user:update', label: 'Update roles & profiles' },
      { key: 'user:delete', label: 'De-provision user identities' },
    ],
  },
  {
    title: 'Endpoint Trust & Devices',
    permissions: [
      { key: 'device:read', label: 'Inspect hardware inventory' },
      { key: 'device:verify', label: 'Verify & approve trusted devices' },
    ],
  },
  {
    title: 'Continuous Sessions',
    permissions: [
      { key: 'session:read', label: 'Monitor active sessions' },
      { key: 'session:revoke', label: 'Forcefully revoke session tokens' },
    ],
  },
  {
    title: 'SOC & Audit Operations',
    permissions: [
      { key: 'audit:read', label: 'Read immutable audit log ledger' },
      { key: 'alert:read', label: 'View SOC threat alerts' },
      { key: 'alert:resolve', label: 'Resolve & mitigate security incidents' },
    ],
  },
  {
    title: 'Enterprise Resources & Authorization',
    permissions: [
      { key: 'resource:read', label: 'View and access catalog resources' },
      { key: 'resource:request', label: 'Submit access requests' },
      { key: 'resource:approve', label: 'Approve/reject access requests' },
      { key: 'policy:manage', label: 'Configure Zero Trust policies' },
    ],
  },
];

export const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/roles');
      if (res.success) {
        setRoles(res.data);
        if (res.data.length > 0 && !activeRole) {
          setActiveRole(res.data[0]);
          setSelectedPermissions(res.data[0].permissions || []);
        }
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSelectRole = (r) => {
    setActiveRole(r);
    setSelectedPermissions(r.permissions || []);
    setSavedSuccess(false);
  };

  const togglePermission = (permKey) => {
    if (activeRole?.name === 'Super Admin') return; // Super admin has root access

    if (selectedPermissions.includes(permKey)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permKey));
    } else {
      setSelectedPermissions([...selectedPermissions, permKey]);
    }
  };

  const handleSavePermissions = async () => {
    if (!activeRole) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await api.put(`/roles/${activeRole._id}`, {
        permissions: selectedPermissions,
      });

      if (res.success) {
        setSavedSuccess(true);
        fetchRoles();
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-cyan-400" /> RBAC Permissions Matrix
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Zero Trust Role-Based Access Control and Standing Privilege Rules
          </p>
        </div>

        {activeRole?.name !== 'Super Admin' && (
          <button
            onClick={handleSavePermissions}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Role Permissions'}</span>
          </button>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Role permissions updated successfully and enforced across backend endpoints.</span>
        </div>
      )}

      {/* Role Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {roles.map((r) => (
          <button
            key={r._id}
            onClick={() => handleSelectRole(r)}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
              activeRole?._id === r._id
                ? 'glass-panel border-cyan-500/50 glow-cyan bg-cyan-500/5'
                : 'glass-panel border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <p className="font-mono text-xs uppercase text-slate-400">Level {r.level}</p>
            <h3 className="font-bold text-white text-base mt-0.5">{r.name}</h3>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{r.description}</p>
            <div className="mt-3 text-[10px] font-mono text-cyan-400">
              {r.permissions?.length || 0} permissions assigned
            </div>
          </button>
        ))}
      </div>

      {/* Permissions Matrix */}
      {activeRole && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                Configuring Permissions: <span className="text-cyan-400">{activeRole.name}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{activeRole.description}</p>
            </div>
            {activeRole.name === 'Super Admin' && (
              <span className="text-xs font-mono px-3 py-1 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
                Root Wildcard Privileges (Immutable)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PERMISSION_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="space-y-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                <h4 className="text-xs font-mono uppercase font-bold text-cyan-400 tracking-wider">
                  {group.title}
                </h4>

                <div className="space-y-2">
                  {group.permissions.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.key) || activeRole.name === 'Super Admin';

                    return (
                      <div
                        key={perm.key}
                        onClick={() => togglePermission(perm.key)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-white'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-mono font-semibold">{perm.key}</p>
                          <p className="text-[11px] text-slate-400">{perm.label}</p>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-cyan-500 border-cyan-400 text-black'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
