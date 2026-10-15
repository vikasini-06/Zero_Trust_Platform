import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
  Shield,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';

export const Login = () => {
  const { login, verifyMfaLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // MFA Challenge State
  const [mfaState, setMfaState] = useState(null); // { tempToken, device }
  const [mfaCode, setMfaCode] = useState('');

  const demoAccounts = [
    { label: 'Super Admin', email: 'superadmin@zerotrust.io', role: 'Full Enterprise Authority' },
    { label: 'Security Admin', email: 'securityadmin@zerotrust.io', role: 'SOC & Revocation Ops' },
    { label: 'Manager', email: 'manager@zerotrust.io', role: 'Team Access Approvals' },
    { label: 'Employee', email: 'employee@zerotrust.io', role: 'Least-Privilege User' },
  ];

  const handleDemoSelect = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.mfaRequired) {
        setMfaState({
          tempToken: res.tempToken,
          device: res.device,
        });
        setLoading(false);
        return;
      }

      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    if (!mfaCode) return;
    setError(null);
    setLoading(true);

    try {
      const res = await verifyMfaLogin(mfaState.tempToken, mfaCode);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'MFA challenge verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid MFA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-400 mx-auto flex items-center justify-center shadow-xl shadow-cyan-500/20 mb-4">
            <Shield className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ZeroTrust Enterprise
          </h1>
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
            "Never Trust, Always Verify"
          </p>
        </div>

        {/* Demo Fast Selector Card */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <UserCheck className="w-3.5 h-3.5" /> Demo Evaluator Accounts:
            </span>
            <span className="text-[11px] text-slate-500">Click to autofill</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acct, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleDemoSelect(acct.email)}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                  email === acct.email
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="font-semibold text-white truncate">{acct.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{acct.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Auth Card */}
        <div className="glass-panel rounded-3xl p-8 border border-slate-800/80 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!mfaState ? (
            /* Primary Password Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-400 font-medium">
                  Enterprise Identity Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@zerotrust.io"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-400 font-medium">
                    Password Hash Secret
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-mono text-cyan-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-bold text-sm tracking-wide transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify Identity & Access</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Multi-Factor Authentication Challenge Form */
            <form onSubmit={handleMfaSubmit} className="space-y-5 animate-in fade-in">
              <div className="text-center space-y-1.5 pb-2 border-b border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base">Two-Factor Authentication Challenge</h3>
                <p className="text-xs text-slate-400">
                  Please enter the 6-digit code from your authenticator app.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-mono text-slate-400 uppercase">TOTP 6-Digit Code</label>
                  <button
                    type="button"
                    onClick={() => setMfaCode('123456')}
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
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMfaState(null)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || mfaCode.length < 6}
                  className="w-2/3 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Confirm Second Factor'}
                </button>
              </div>
            </form>
          )}

          {/* Registration link */}
          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>New employee without directory identity? </span>
            <Link to="/register" className="text-cyan-400 hover:underline font-semibold">
              Enroll Device & Register
            </Link>
          </div>
        </div>

        {/* Security Disclaimers */}
        <div className="text-center text-[11px] text-slate-500 font-mono space-y-1">
          <p>Continuous posture evaluation: Browser, IP geofencing, risk scoring active.</p>
          <p>Zero Trust Prototype for Cybersecurity Final-Year Evaluation.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
