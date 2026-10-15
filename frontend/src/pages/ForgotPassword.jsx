import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Shield,
  Mail,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Copy,
  ExternalLink,
} from 'lucide-react';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.success) {
        setResult(res);
      } else {
        setError(res.message || 'Password reset request failed');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to dispatch password reset. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-400 mx-auto flex items-center justify-center shadow-xl shadow-cyan-500/20 mb-4">
            <KeyRound className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Account Recovery
          </h1>
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
            Identity Credential Authorization
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

          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your enterprise email address. Under Zero Trust policy, a one-time cryptographic reset authorization token will be dispatched.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-400 font-medium">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@zerotrust.io"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono transition-all"
                  />
                </div>
              </div>

              {/* Fast autofill for demo */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEmail('employee@zerotrust.io')}
                  className="text-[11px] font-mono text-slate-400 hover:text-cyan-400 underline"
                >
                  Use Demo: employee@zerotrust.io
                </button>
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
                    <span>Generate Reset Token</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Reset Authorization Issued</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.message}
                </p>
              </div>

              {/* Demo Fast-Track Token Card */}
              {result.resetToken && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-400 uppercase font-semibold">
                      Demo Evaluation Token
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToken(result.resetToken)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[11px]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 font-mono text-[11px] text-cyan-300 break-all select-all border border-slate-800">
                    {result.resetToken}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/reset-password?token=${result.resetToken}`)}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Password Reset</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Back to Login link */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <Link
              to="/login"
              className="text-xs text-slate-400 hover:text-cyan-400 font-mono inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Identity Authentication</span>
            </Link>
          </div>
        </div>

        {/* Security Disclaimers */}
        <div className="text-center text-[11px] text-slate-500 font-mono">
          <p>Zero Trust Access Control • Cryptographic Time-Bounded Token</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
