import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import {
  Users as UsersIcon,
  Plus,
  Shield,
  KeyRound,
  Lock,
  Unlock,
  Trash2,
  Edit,
  X,
  UserCheck,
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SecurityBadge from '../components/SecurityBadge';

export const Users = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.roleName === 'Super Admin';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleName: 'Employee',
    department: 'Software Engineering',
    title: 'Analyst',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      if (res.success) setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/users', formData);
      if (res.success) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          roleName: 'Employee',
          department: 'Software Engineering',
          title: 'Analyst',
        });
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/users/${editUser._id}`, {
        name: editUser.name,
        department: editUser.department,
        title: editUser.title,
        roleName: editUser.roleName,
        status: editUser.status,
      });
      if (res.success) {
        setEditUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlock = async (id, email) => {
    try {
      const res = await api.put(`/users/${id}/unlock`);
      if (res.success) {
        alert(`Account for ${email} has been unlocked.`);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unlock failed');
    }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Permanently remove identity [${email}] and revoke all associated sessions?`)) return;
    try {
      const res = await api.delete(`/users/${id}`);
      if (res.success) fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      header: 'Identity Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-semibold text-white">{row.name}</p>
          <span className="text-[11px] font-mono text-slate-400">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Assigned RBAC Role',
      accessor: 'roleName',
      render: (row) => (
        <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          {row.roleName}
        </span>
      ),
    },
    {
      header: 'Department & Title',
      accessor: 'department',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="text-slate-300">{row.department}</div>
          <div className="text-[11px] text-slate-500">{row.title}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const isLocked = row.lockUntil && new Date(row.lockUntil) > new Date();
        if (isLocked) {
          return <SecurityBadge status="BLOCKED" size="sm" />;
        }
        return <SecurityBadge status={row.status || 'Active'} size="sm" />;
      },
    },
    {
      header: 'MFA State',
      accessor: 'mfaEnabled',
      render: (row) => (
        <span
          className={`font-mono text-xs px-2 py-0.5 rounded font-semibold ${
            row.mfaEnabled
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {row.mfaEnabled ? 'ENABLED' : 'DISABLED'}
        </span>
      ),
    },
    {
      header: 'Controls',
      accessor: '_id',
      render: (row) => {
        const isLocked = row.lockUntil && new Date(row.lockUntil) > new Date();

        return (
          <div className="flex items-center gap-1.5 font-mono">
            {isLocked && (
              <button
                onClick={() => handleUnlock(row._id, row.email)}
                className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30"
                title="Unlock Locked Account"
              >
                <Unlock className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setEditUser(row)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              title="Edit Profile & Role"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>

            {isSuperAdmin && row.email !== currentUser.email && (
              <button
                onClick={() => handleDelete(row._id, row.email)}
                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                title="Delete Identity"
              >
                <Trash2 className="w-3.5 h-3.5" />
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
            <UsersIcon className="w-6 h-6 text-cyan-400" /> Enterprise User Directory & RBAC
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Identity lifecycle management, role delegation, and standing privilege governance
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Identity</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchKey="name"
        searchPlaceholder="Filter directory by name or email..."
      />

      {/* Provision Identity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg glass-panel border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="font-bold text-white text-base flex items-center gap-2 font-mono">
                <UserCheck className="w-5 h-5 text-cyan-400" /> Provision Enterprise Identity
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase">Legal Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase">Temporary Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase">Assigned Role</label>
                  <select
                    value={formData.roleName}
                    onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Security Admin">Security Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all disabled:opacity-50"
                >
                  {submitting ? 'Provisioning...' : 'Confirm Provisioning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md glass-panel border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                <Edit className="w-4 h-4 text-cyan-400" /> Edit Identity: {editUser.email}
              </h3>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase">Assigned Role</label>
                <select
                  value={editUser.roleName}
                  onChange={(e) => setEditUser({ ...editUser, roleName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-cyan-500 focus:outline-none text-cyan-400 font-semibold"
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Security Admin">Security Admin</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase">Account Status</label>
                <select
                  value={editUser.status}
                  onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Locked">Locked</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
