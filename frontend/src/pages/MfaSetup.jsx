import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import {
  KeyRound,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import SecurityBadge from '../components/SecurityBadge';

export const MfaSetup = () => {
  const { user, refreshUser } = useAuth();

  const [setupData, setSetupData] = useState(null); // { secret, qrCodeUrl, otpauth }
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Disable MFA form
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disabling, setDisabling] = useState(false);

  const handleStartSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/mfa/setup');
      if (res.success) {
        setSetupData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEnable = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/mfa/verify-enable', { code });
      if (res.success) {
        setMessage('Multi-Factor Authentication has been successfully activated!');
        setSetupData(null);
        setCode('');
        await refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async (e) => {
    e.preventDefault();
    setDisabling(true);
    setError(null);

    try {
      const res = await api.post('/auth/mfa/disable', {
        password: disablePassword,
      });

      if (res.success) {
        setShowDisableModal(false);
        setDisablePassword('');
        setMessage('Multi-Factor Authentication has been disabled for this account.');
        await refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password verification failed');
    } finally {
      setDisabling(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <KeyRound className="w-6 h-6 text-cyan-400" /> Multi-Factor Authentication (TOTP)
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Zero Trust Second-Factor Identity Verification via RFC 6238 Time-based One-Time Passwords
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status Card */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Current 2FA Status</span>
            <h3 className="text-lg font-bold text-white">
              {user?.mfaEnabled ? 'Hardware / App MFA is Active' : 'MFA is Disabled'}
            </h3>
          </div>
          <SecurityBadge status={user?.mfaEnabled ? 'TRUSTED' : 'WARNING'} />
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-mono">
          In a Zero Trust architecture, passwords alone represent static perimeter defenses.
          Multi-Factor Authentication ensures that compromised credentials cannot grant network access
          without real-time cryptographic possession of a second factor device.
        </p>

        {user?.mfaEnabled ? (
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Account is protected by Time-Based OTP
            </span>
            <button
              onClick={() => setShowDisableModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono font-semibold transition-all"
            >
              Disable MFA
            </button>
          </div>
        ) : (
          !setupData && (
            <div className="pt-2">
              <button
                onClick={handleStartSetup}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <QrCode className="w-4 h-4" />
                <span>{loading ? 'Generating...' : 'Configure Authenticator App'}</span>
              </button>
            </div>
          )
        )}
      </div>

      {/* Setup Wizard (If Initiated) */}
      {setupData && !user?.mfaEnabled && (
        <div className="glass-panel rounded-3xl p-6 border border-cyan-500/40 glow-cyan space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Enroll Authenticator Application</h3>
              <p className="text-xs text-slate-400 font-mono">
                Scan the QR code with Google Authenticator, Microsoft Authenticator, or 1Password
              </p>
            </div>
            <button
              onClick={() => setSetupData(null)}
              className="text-xs text-slate-400 hover:text-white font-mono"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* QR Code Box */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white rounded-2xl p-4 shadow-xl mx-auto">
              <img
                src={setupData.qrCodeUrl}
                alt="TOTP QR Code"
                className="w-48 h-48 object-contain"
              />
              <span className="text-[11px] text-slate-700 font-mono mt-2 font-semibold">
                Scan with Authenticator App
              </span>
            </div>

            {/* Secret & Code Verification */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase">
                  Manual Entry Secret Key:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={setupData.secret}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-400 font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(setupData.secret)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                    title="Copy Secret"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerifyEnable} className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-mono text-slate-400 uppercase">Verification Code:</label>
                    <button
                      type="button"
                      onClick={() => setCode('123456')}
                      className="text-cyan-400 hover:underline font-mono text-[11px]"
                    >
                      Autofill Demo Code (123456)
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all disabled:opacity-50"
                >
                  {loading ? 'Activating...' : 'Verify Code & Enable MFA'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Disable Confirmation Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md glass-panel border border-slate-700 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Confirm MFA Deactivation</h3>
                <p className="text-xs text-slate-400">This will lower your Zero Trust posture score.</p>
              </div>
            </div>

            <form onSubmit={handleDisableMfa} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 uppercase">Confirm Account Password</label>
                <input
                  type="password"
                  required
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disabling}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold transition-all disabled:opacity-50"
                >
                  {disabling ? 'Deactivating...' : 'Confirm Deactivation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MfaSetup;
