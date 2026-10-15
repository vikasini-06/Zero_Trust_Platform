import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import {
  FileCheck,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Shield,
  Send,
  X,
} from 'lucide-react';
import SecurityBadge from '../components/SecurityBadge';
import RiskBadge from '../components/RiskBadge';
import DataTable from '../components/DataTable';

export const AccessRequests = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isApprover = user?.roleName === 'Manager' || user?.roleName === 'Security Admin' || user?.roleName === 'Super Admin';

  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [reason, setReason] = useState('');
  const [requestedPermission, setRequestedPermission] = useState('READ');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Review Modal State
  const [reviewRequest, setReviewRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState('approve');
  const [reviewing, setReviewing] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url = isApprover ? '/access-requests' : '/access-requests/me';
      const res = await api.get(url);
      if (res.success) setRequests(res.data);
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await api.get('/access-requests/resources');
      if (res.success) {
        setResources(res.data);
        if (res.data.length > 0 && !selectedResourceId) {
          setSelectedResourceId(res.data[0].resourceId);
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchRequests();
    fetchResources();

    if (location.state?.targetResource) {
      setSelectedResourceId(location.state.targetResource.resourceId);
      setShowCreateModal(true);
    }
  }, [isApprover]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await api.post('/access-requests', {
        resourceId: selectedResourceId,
        reason,
        requestedPermission,
      });

      if (res.success) {
        setShowCreateModal(false);
        setReason('');
        fetchRequests();
      } else {
        setFormError(res.message);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit access request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewRequest) return;
    setReviewing(true);

    try {
      const endpoint = reviewAction === 'approve'
        ? `/access-requests/${reviewRequest._id}/approve`
        : `/access-requests/${reviewRequest._id}/reject`;

      const res = await api.put(endpoint, { reviewNotes });
      if (res.success) {
        setReviewRequest(null);
        setReviewNotes('');
        fetchRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewing(false);
    }
  };

  const columns = [
    {
      header: 'Requester',
      accessor: 'requesterName',
      render: (row) => (
        <div>
          <p className="font-semibold text-white">{row.requesterName}</p>
          <span className="text-[11px] font-mono text-cyan-400">{row.requesterRole}</span>
        </div>
      ),
    },
    {
      header: 'Resource',
      accessor: 'resourceName',
      render: (row) => (
        <div>
          <p className="font-semibold text-white">{row.resourceName}</p>
          <span className="text-[11px] font-mono text-slate-400">{row.resourceCategory}</span>
        </div>
      ),
    },
    {
      header: 'Privilege',
      accessor: 'requestedPermission',
      render: (row) => (
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
          {row.requestedPermission}
        </span>
      ),
    },
    {
      header: 'Justification',
      accessor: 'reason',
      render: (row) => (
        <p className="text-xs text-slate-300 max-w-xs truncate" title={row.reason}>
          {row.reason}
        </p>
      ),
    },
    {
      header: 'ZT Risk Score',
      accessor: 'riskScore',
      render: (row) => <RiskBadge score={row.riskScore} />,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <SecurityBadge status={row.status} size="sm" />,
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row) => {
        if (isApprover && row.status === 'PENDING') {
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setReviewRequest(row);
                  setReviewAction('approve');
                  setReviewNotes('Approved following verification of role need.');
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold transition-all"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setReviewRequest(row);
                  setReviewAction('reject');
                  setReviewNotes('Rejected based on least-privilege boundary.');
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-mono font-semibold transition-all"
              >
                Reject
              </button>
            </div>
          );
        }
        return (
          <span className="text-xs text-slate-500 font-mono">
            {row.reviewedByName ? `By ${row.reviewedByName}` : '—'}
          </span>
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
            <FileCheck className="w-6 h-6 text-cyan-400" /> Enterprise Access Requests
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Just-in-Time & Least-Privilege Authorization Workflow
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Access Request</span>
        </button>
      </div>

      {/* Access Requests Ledger */}
      <DataTable
        columns={columns}
        data={requests}
        loading={loading}
        searchKey="resourceName"
        searchPlaceholder="Filter requests by resource or reason..."
      />

      {/* Submit Access Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg glass-panel border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="font-bold text-white text-base flex items-center gap-2 font-mono">
                <FileCheck className="w-5 h-5 text-cyan-400" /> New Just-in-Time Access Request
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase">Target Resource</label>
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                >
                  {resources.map((r) => (
                    <option key={r.resourceId} value={r.resourceId}>
                      {r.name} ({r.classification})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase">Requested Privilege Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['READ', 'WRITE', 'ADMIN'].map((perm) => (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => setRequestedPermission(perm)}
                      className={`py-2 rounded-xl text-xs font-mono font-semibold border transition-all ${
                        requestedPermission === perm
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {perm}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase">
                  Business Justification (Required)
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide precise ticket ID, sprint story, or business justification..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 font-mono space-y-1">
                <p className="text-cyan-400 font-semibold">Zero Trust Policy Note:</p>
                <p>
                  Upon submission, your endpoint posture, role permissions, and anomaly indicators will
                  be automatically evaluated to compute an initial risk recommendation.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all disabled:opacity-50"
                >
                  {submitting ? 'Evaluating...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review & Decision Modal */}
      {reviewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md glass-panel border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                {reviewAction === 'approve' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                {reviewAction === 'approve' ? 'Approve Access Request' : 'Reject Access Request'}
              </h3>
              <button
                onClick={() => setReviewRequest(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <p className="text-white font-semibold">{reviewRequest.resourceName}</p>
                <p className="text-slate-400">
                  Requester: <span className="text-cyan-400">{reviewRequest.requesterName}</span>
                </p>
                <p className="text-slate-400">Justification: "{reviewRequest.reason}"</p>
                <div className="pt-2 flex items-center gap-2">
                  <RiskBadge score={reviewRequest.riskScore} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase">Reviewer Finding / Notes</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewRequest(null)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  disabled={reviewing}
                  className={`px-5 py-2 rounded-xl font-bold text-black transition-all ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-400 hover:bg-emerald-300'
                      : 'bg-rose-500 hover:bg-rose-400 text-white'
                  }`}
                >
                  {reviewing ? 'Recording...' : `Confirm ${reviewAction.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessRequests;
