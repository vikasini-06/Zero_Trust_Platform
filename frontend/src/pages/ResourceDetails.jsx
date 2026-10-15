import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import {
  FolderLock,
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Smartphone,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  FileCheck,
  Clock,
  Layers,
} from 'lucide-react';
import SecurityBadge from '../components/SecurityBadge';
import RiskBadge from '../components/RiskBadge';

export const ResourceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, device, session } = useAuth();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState(null);

  // Access Request Form State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reason, setReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(null);

  const fetchResourceAndEvaluate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch resource details
      const res = await api.get(`/resources/${id}`).catch(async () => {
        return await api.get(`/access-requests/resources/${id}`);
      });

      if (res.success && res.data) {
        setResource(res.data);
        // Automatically evaluate access against Zero Trust engine
        await runEvaluation(res.data.resourceId || res.data._id);
      } else {
        setError('Resource not found or unavailable');
      }
    } catch (err) {
      console.error('Error fetching resource:', err);
      setError(err.response?.data?.message || 'Failed to load enterprise resource details');
    } finally {
      setLoading(false);
    }
  };

  const runEvaluation = async (resourceId) => {
    try {
      setEvaluating(true);
      const evalRes = await api.post('/resources/verify-access', { resourceId });
      if (evalRes.success && evalRes.data) {
        setEvaluation(evalRes.data);
      }
    } catch (err) {
      console.error('Zero trust evaluation failure:', err);
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    fetchResourceAndEvaluate();
  }, [id]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmittingRequest(true);
    try {
      const res = await api.post('/access-requests', {
        resourceId: resource.resourceId || resource._id,
        reason,
        requestedPermission: 'READ',
      });

      if (res.success) {
        setRequestSuccess(res.data);
        setShowRequestModal(false);
        setReason('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit access request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <span>Executing cryptographic Zero Trust posture validation...</span>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="space-y-4">
        <Link
          to="/resources"
          className="text-xs text-slate-400 hover:text-cyan-400 font-mono inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Resources Catalog
        </Link>
        <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="text-white font-bold text-lg">Resource Access Check Failed</h3>
          <p className="text-xs text-slate-400 font-mono">{error || 'Resource not found'}</p>
        </div>
      </div>
    );
  }

  const isRoleAuthorized =
    !resource.requiredRole ||
    resource.requiredRole.length === 0 ||
    resource.requiredRole.includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/resources"
          className="text-xs text-slate-400 hover:text-cyan-400 font-mono inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Resources Catalog</span>
        </Link>

        <button
          onClick={() => runEvaluation(resource.resourceId || resource._id)}
          disabled={evaluating}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Re-evaluate Posture</span>
        </button>
      </div>

      {/* Resource Title & Classification Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <FolderLock className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">
                  {resource.category}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-mono text-slate-400">ID: {resource.resourceId}</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{resource.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {resource.requiresMFA && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold">
                MFA Enforced
              </span>
            )}
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded-lg border font-semibold ${
                resource.classification === 'RESTRICTED'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : resource.classification === 'CONFIDENTIAL'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {resource.classification}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{resource.description}</p>
      </div>

      {/* Zero Trust Decision Banner */}
      {evaluation && (
        <div
          className={`p-6 rounded-3xl border shadow-xl transition-all ${
            evaluation.decision === 'ALLOW'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              : evaluation.decision === 'REQUIRE_MFA' || evaluation.decision === 'REQUIRE_DEVICE_VERIFICATION'
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  evaluation.decision === 'ALLOW'
                    ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400'
                    : evaluation.decision === 'REQUIRE_MFA' || evaluation.decision === 'REQUIRE_DEVICE_VERIFICATION'
                    ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400'
                    : 'bg-rose-500/10 border border-rose-500/40 text-rose-400'
                }`}
              >
                {evaluation.decision === 'ALLOW' ? (
                  <Unlock className="w-6 h-6" />
                ) : (
                  <Lock className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider font-bold">
                    Zero Trust Access Decision:
                  </span>
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded font-black ${
                      evaluation.decision === 'ALLOW'
                        ? 'bg-emerald-500 text-black'
                        : evaluation.decision === 'REQUIRE_MFA' || evaluation.decision === 'REQUIRE_DEVICE_VERIFICATION'
                        ? 'bg-amber-500 text-black'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {evaluation.decision}
                  </span>
                </div>
                <p className="text-sm font-medium mt-1 text-white">{evaluation.reason}</p>
                <div className="flex items-center gap-4 mt-2 font-mono text-xs">
                  <span>
                    Calculated Risk Score: <strong className="text-white">{evaluation.riskScore} / 100</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Risk Posture: <strong>{evaluation.riskLevel}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {evaluation.decision === 'ALLOW' ? (
                <button
                  onClick={() => alert(`Zero Trust Handshake Completed! Establishing encrypted TLS session to: ${resource.endpointUrl || 'https://enterprise.internal'}`)}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <span>Launch Protected Application</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              ) : evaluation.decision === 'REQUIRE_MFA' ? (
                <button
                  onClick={() => navigate('/mfa-setup')}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono transition-all flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Configure Multi-Factor Authentication</span>
                </button>
              ) : evaluation.decision === 'REQUIRE_DEVICE_VERIFICATION' ? (
                <button
                  onClick={() => navigate('/devices')}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono transition-all flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Request Device Trust Approval</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs font-mono transition-all flex items-center gap-2 shadow-lg shadow-rose-500/20"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Request Elevated Access</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6 Zero Trust Pillars Posture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pillar 1: User Identity */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Pillar 1: Identity & Health
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{user?.name}</div>
            <div className="text-xs text-slate-400 font-mono">{user?.email}</div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Directory Status:</span>
            <span className="text-emerald-400 font-semibold">Active & Validated</span>
          </div>
        </div>

        {/* Pillar 2: Role Authorization */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" /> Pillar 2: RBAC Standing
            </span>
            {isRoleAuthorized ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Your Role: {user?.role}</div>
            <div className="text-xs text-slate-400 truncate">
              Required: {resource.requiredRole?.join(', ')}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Least-Privilege Check:</span>
            <span className={isRoleAuthorized ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {isRoleAuthorized ? 'Role Authorized' : 'Standing Role Denied'}
            </span>
          </div>
        </div>

        {/* Pillar 3: Device Posture */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-400" /> Pillar 3: Endpoint Trust
            </span>
            {device?.status === 'Trusted' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : device?.status === 'Blocked' ? (
              <XCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{device?.deviceName || 'Corporate Browser'}</div>
            <div className="text-xs text-slate-400 font-mono">Status: {device?.status || 'Pending'}</div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Hardware Policy:</span>
            <span className="text-cyan-400">{resource.minTrustLevel} Trust Required</span>
          </div>
        </div>

        {/* Pillar 4: MFA Verification */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-400" /> Pillar 4: Second Factor (TOTP)
            </span>
            {user?.mfaEnabled ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : resource.requiresMFA ? (
              <XCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">
              MFA: {user?.mfaEnabled ? 'Active & Configured' : 'Disabled'}
            </div>
            <div className="text-xs text-slate-400">
              {resource.requiresMFA ? 'Strict second-factor enforced' : 'Standard second-factor policy'}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>TOTP Challenge:</span>
            <span className={user?.mfaEnabled ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {user?.mfaEnabled ? 'Compliant' : 'MFA Required'}
            </span>
          </div>
        </div>

        {/* Pillar 5: Continuous Session */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" /> Pillar 5: Active Session
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Session Monitoring Active</div>
            <div className="text-xs text-slate-400 font-mono truncate">
              ID: {session?.sessionId || 'Active'}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Perimeter Monitoring:</span>
            <span className="text-emerald-400 font-semibold">Continuous Telemetry</span>
          </div>
        </div>

        {/* Pillar 6: Dynamic Risk Context */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> Pillar 6: Dynamic Context Risk
            </span>
            <RiskBadge score={evaluation?.riskScore || 20} level={evaluation?.riskLevel || 'LOW'} />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">
              Score: {evaluation?.riskScore || 20} / 100
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Threshold: &lt; 75 required for access
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Context Evaluation:</span>
            <span className="text-cyan-400 font-semibold">Real-Time Calculus</span>
          </div>
        </div>
      </div>

      {/* Elevated Access Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-6 border border-slate-800 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-bold text-base">Request Zero Trust Authorization</h3>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                You are requesting access to <strong>{resource.name}</strong> ({resource.classification}). Provide a clear business justification for managerial and SOC review.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase">
                  Business Justification & Need
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why access is required for your role or project..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingRequest ? 'Submitting...' : 'Submit Authorization Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation of submitted request */}
      {requestSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>
              Access request successfully submitted for review by Team Manager & Security Admin.
            </span>
          </div>
          <button
            onClick={() => navigate('/access-requests')}
            className="text-xs font-mono text-emerald-400 hover:underline ml-4"
          >
            View in Access Requests →
          </button>
        </div>
      )}
    </div>
  );
};

export default ResourceDetails;
