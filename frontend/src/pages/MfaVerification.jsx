import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

export const MfaVerification = () => {
  const { verifyMfaLogin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tempToken = location.state?.tempToken || localStorage.getItem('zerotrust_temp_mfa_token') || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length < 6) return;
    setError(null);
    setLoading(true);

    try {
      if (!tempToken) {
        setError('No active MFA challenge session found. Please log in first.');
        setLoading(false);
        return;
      }

      const res = await verifyMfaLogin(tempToken, code);
      if (res.success) {
        localStorage.removeItem('zerotrust_temp_mfa_token');
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.message || 'MFA challenge verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid MFA code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-xl shadow-amber-500/10 mb-4">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Two-Factor Verification
          </h1>
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
            Zero Trust Step-Up Identity Check
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 border border-slate-800/80 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!tempToken ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
                <Smartphone className="w-6 h-6 text-cyan-400 mx-auto" />
                <p>
                  No pending MFA challenge is active for this browser. Please sign in with your enterprise credentials first.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all flex items-center justify-center gap-2"
              >
                <span>Go to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
              <div className="text-center space-y-1.5 pb-2 border-b border-slate-800">
                <p className="text-xs text-slate-400">
                  Please enter the 6-digit TOTP code from your mobile authenticator application (Google Authenticator, Authy, etc.).
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-mono text-slate-400 uppercase">TOTP Code</label>
                  <button
                    type="button"
                    onClick={() => setCode('123456')}
                    className="text-cyan-400 hover:underline font-mono text-[11px]"
                  >
                    Use Demo Code (123456)
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-bold text-sm tracking-wide transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify & Grant Access</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="text-xs text-slate-400 hover:text-cyan-400 font-mono inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Credentials Login</span>
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Security Disclaimers */}
        <div className="text-center text-[11px] text-slate-500 font-mono">
          <p>Zero Trust Access Control • Cryptographic TOTP Verification</p>
        </div>
      </div>
    </div>
  );
};

export default MfaVerification;
