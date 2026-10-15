import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Smartphone,
  Cpu,
  Globe,
  Key,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  X,
} from 'lucide-react';
import RiskBadge from './RiskBadge';
import SecurityBadge from './SecurityBadge';

export const ZeroTrustModal = ({ resource, isOpen, onClose, onRequestAccess }) => {
  const [evaluating, setEvaluating] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const evaluatedKeyRef = React.useRef(null);

  const runEvaluation = async () => {
    if (!resource) return;
    setEvaluating(true);
    setError(null);
    setActiveStep(1);

    const timeouts = [];
    timeouts.push(setTimeout(() => setActiveStep(2), 300));
    timeouts.push(setTimeout(() => setActiveStep(3), 600));
    timeouts.push(setTimeout(() => setActiveStep(4), 900));

    try {
      const response = await api.post('/access-requests/verify-access', {
        resourceId: resource.resourceId || resource._id,
      });

      timeouts.push(
        setTimeout(() => {
          setResult(response.data);
          setEvaluating(false);
          setActiveStep(5);
        }, 1100)
      );
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfter = err.response.headers?.['retry-after'];
        const waitNotice = retryAfter ? ` (retry in ${retryAfter}s)` : '';
        setError(`Rate limit reached: Too many requests${waitNotice}. Please wait a moment before trying again.`);
      } else {
        setError(err.response?.data?.message || 'Access evaluation failure');
      }
      setEvaluating(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !resource) {
      setResult(null);
      setEvaluating(true);
      setError(null);
      evaluatedKeyRef.current = null;
      return;
    }

    const currentKey = `${resource.resourceId || resource._id}_${isOpen}`;
    if (evaluatedKeyRef.current === currentKey) {
      return;
    }
    evaluatedKeyRef.current = currentKey;

    runEvaluation();
  }, [isOpen, resource?.resourceId, resource?._id]);

  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl glass-panel border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-lg">{resource.name}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {resource.classification}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Continuous Access Decision Checkpoint (CADC)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {evaluating ? (
            <div className="py-10 text-center space-y-5">
              <div className="relative inline-block">
                <div className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-white">
                  Zero Trust Policy Engine Active
                </h4>
                <p className="text-xs font-mono text-cyan-400">
                  {activeStep === 1 && 'Pillar 1/5: Verifying User Identity & Account Posture...'}
                  {activeStep === 2 && 'Pillar 2/5: Inspecting Device Hardware Trust Signature...'}
                  {activeStep === 3 && 'Pillar 3/5: Evaluating MFA Status & Session Context...'}
                  {activeStep === 4 && 'Pillar 4/5: Computing Dynamic Risk Matrix & RBAC Matrix...'}
                  {activeStep >= 5 && 'Finalizing Access Authorization Decision...'}
                </p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Verdict Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-4 ${
                  result.decision === 'ALLOW'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : result.decision === 'REQUIRE_MFA' || result.decision === 'REQUIRE_DEVICE_VERIFICATION'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="mt-0.5">
                  {result.decision === 'ALLOW' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : result.decision === 'REQUIRE_MFA' || result.decision === 'REQUIRE_DEVICE_VERIFICATION' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">
                      Decision: {result.decision}
                    </span>
                    <RiskBadge score={result.riskScore} />
                  </div>
                  <p className="text-sm font-medium mt-1 text-white">{result.reason}</p>
                </div>
              </div>

              {/* Zero Trust 5-Pillar Breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                  Verification Evaluation Breakdown
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-cyan-400" /> User Identity
                    </span>
                    <span className="text-emerald-400 font-semibold">PASS (Verified)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Hardware Posture
                    </span>
                    <span
                      className={
                        result.decision === 'REQUIRE_DEVICE_VERIFICATION'
                          ? 'text-amber-400 font-semibold'
                          : 'text-emerald-400 font-semibold'
                      }
                    >
                      {result.decision === 'REQUIRE_DEVICE_VERIFICATION' ? 'PENDING' : 'VALIDATED'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" /> Multi-Factor State
                    </span>
                    <span
                      className={
                        result.decision === 'REQUIRE_MFA'
                          ? 'text-amber-400 font-semibold'
                          : 'text-emerald-400 font-semibold'
                      }
                    >
                      {result.decision === 'REQUIRE_MFA' ? 'MFA REQUIRED' : 'SATISFIED'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> Continuous Session
                    </span>
                    <span className="text-emerald-400 font-semibold">ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Factors list */}
              {result.factors && result.factors.length > 0 && (
                <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                  <p className="text-[11px] font-mono uppercase text-slate-400">
                    Contributing Risk & Context Factors:
                  </p>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {result.factors.map((factor, i) => (
                      <li key={i} className="flex items-center gap-2 font-mono">
                        <span className="text-cyan-400">•</span> {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* If Allowed, show simulated enterprise application preview */}
              {result.allowed && (
                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4" /> Live Protected Enclave Session Active
                    </h5>
                    <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
                      SSL/TLS TLSv1.3 Encrypted
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    You have successfully cleared the Zero Trust perimeter policy. Secure telemetry
                    and audit trail have recorded access to <span className="text-cyan-300 font-semibold">{resource.name}</span>.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-rose-400 space-y-3">
              <ShieldAlert className="w-12 h-12 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => {
                  evaluatedKeyRef.current = null;
                  runEvaluation();
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 font-mono text-xs transition-all inline-flex items-center gap-2"
              >
                <span>Retry Evaluation Checkpoint</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            ZeroTrust Core v1.0 • "Never Trust, Always Verify"
          </span>
          <div className="flex items-center gap-2">
            {!result?.allowed && !evaluating && (
              <button
                onClick={() => {
                  onClose();
                  if (onRequestAccess) onRequestAccess(resource);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-all shadow-lg shadow-cyan-500/20"
              >
                Submit Access Request
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-all"
            >
              Close Checkpoint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZeroTrustModal;
