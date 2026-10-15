import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { hasRole, hasPermission } from '../utils/permissions';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export const ProtectedRoute = ({ children, roles = [], permission = null }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase">
          Verifying Zero Trust Identity...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !hasRole(user, ...roles)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-panel border border-rose-500/30 rounded-2xl p-8 text-center space-y-4 glow-rose">
          <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">Access Forbidden (RBAC)</h2>
          <p className="text-sm text-slate-400">
            Your assigned role <span className="text-rose-400 font-semibold font-mono">[{user.roleName || user.role}]</span> lacks sufficient standing privileges to inspect this resource.
          </p>
          <div className="pt-2">
            <span className="text-xs bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg font-mono">
              Required: {roles.join(' or ')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (permission && !hasPermission(user, permission)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-panel border border-amber-500/30 rounded-2xl p-8 text-center space-y-4 glow-amber">
          <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">Missing Permission</h2>
          <p className="text-sm text-slate-400">
            Least privilege policy is actively enforcing restriction. Missing permission token:
          </p>
          <span className="inline-block text-xs bg-slate-900 border border-slate-700 text-amber-400 px-3 py-1.5 rounded-lg font-mono">
            {permission}
          </span>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
