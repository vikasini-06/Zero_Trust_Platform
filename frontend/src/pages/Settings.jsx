import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import {
  Settings as SettingsIcon,
  Lock,
  User,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import SecurityBadge from '../components/SecurityBadge';

export const Settings = () => {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setStatusMsg('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Password update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-cyan-400" /> Security Policies & Identity Settings
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Zero Trust Configuration Profiles & Cryptographic Credentials
        </p>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Identity Summary Card */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" /> Enrolled Identity Attributes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500">Legal Name:</span>
            <p className="text-white font-semibold">{user?.name}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500">Enterprise Email:</span>
            <p className="text-cyan-400 font-semibold">{user?.email}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500">RBAC Role Authority:</span>
            <div className="pt-0.5">
              <SecurityBadge status={user?.roleName || user?.role} size="sm" />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500">Department / Division:</span>
            <p className="text-white font-semibold">{user?.department || 'Operations'}</p>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" /> Cryptographic Credential Rotation
        </h3>
        <p className="text-xs text-slate-400 font-mono">
          Update your identity password. Passwords are hash-salted with bcrypt.
        </p>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md font-mono text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 uppercase">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 uppercase">New Password (min 6 chars)</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 uppercase">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all disabled:opacity-50"
          >
            {loading ? 'Rotating...' : 'Rotate Password'}
          </button>
        </form>
      </div>

      {/* Active Zero Trust Enforced Policies */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" /> Active Zero Trust Policy Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <p className="text-white font-semibold">Continuous Session Duration</p>
            <p className="text-slate-400 text-[11px]">
              24-hour maximum token validity with continuous heartbeat revocation checks.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <p className="text-white font-semibold">Brute-Force Anomaly Lockout</p>
            <p className="text-slate-400 text-[11px]">
              5 failed consecutive password submissions automatically locks identity for 15 minutes.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <p className="text-white font-semibold">Hardware Quarantine Policy</p>
            <p className="text-slate-400 text-[11px]">
              Endpoints marked as Blocked instantly sever active websocket sessions at perimeter.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <p className="text-white font-semibold">Adaptive Risk Thresholds</p>
            <p className="text-slate-400 text-[11px]">
              Scores &ge; 71 categorized as High Risk; scores &ge; 75 trigger automated SUSPICIOUS intercept.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
