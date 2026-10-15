import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { hasRole, hasPermission } from '../utils/permissions';
import {
  LayoutDashboard,
  Shield,
  Smartphone,
  KeyRound,
  Users,
  Lock,
  FileText,
  FileCheck,
  AlertTriangle,
  Settings,
  FolderLock,
  Layers,
  Activity,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const isSuperAdmin = hasRole(user, 'Super Admin');
  const isSecurityAdmin = hasRole(user, 'Security Admin', 'Super Admin');
  const isManager = hasRole(user, 'Manager', 'Security Admin', 'Super Admin');

  const navSection = (title, items) => {
    const visibleItems = items.filter((item) => item.show);
    if (visibleItems.length === 0) return null;

    return (
      <div className="space-y-1 mb-6">
        <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">
          {title}
        </p>
        {visibleItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.to}
            onClick={() => {
              if (window.innerWidth < 1024 && onClose) onClose();
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/5 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span className="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    );
  };

  const navGroups = [
    {
      title: 'Zero Trust Control',
      items: [
        { label: 'Security Dashboard', to: '/dashboard', icon: LayoutDashboard, show: true },
        { label: 'Enterprise Resources', to: '/resources', icon: FolderLock, show: true },
        { label: 'Access Requests', to: '/access-requests', icon: FileCheck, show: true },
      ],
    },
    {
      title: 'Identity & Posture',
      items: [
        { label: 'Device Inventory', to: '/devices', icon: Smartphone, show: true },
        { label: 'Active Sessions', to: '/sessions', icon: Activity, show: true },
        { label: 'TOTP Multi-Factor', to: '/mfa-setup', icon: KeyRound, show: true },
      ],
    },
    {
      title: 'SOC & Governance',
      items: [
        { label: 'SOC Security Alerts', to: '/security', icon: AlertTriangle, show: isSecurityAdmin },
        { label: 'User Directory', to: '/admin/users', icon: Users, show: isManager },
        { label: 'RBAC Roles Matrix', to: '/admin/roles', icon: Layers, show: isSuperAdmin },
        { label: 'Immutable Audit Trail', to: '/admin/audit-logs', icon: FileText, show: isSecurityAdmin },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Security Policies & Settings', to: '/settings', icon: Settings, show: true },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-[#080b12] border-r border-slate-800/80 p-4 overflow-y-auto transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="py-2">
          {navGroups.map((group, idx) => (
            <React.Fragment key={idx}>{navSection(group.title, group.items)}</React.Fragment>
          ))}
        </div>

        {/* Security Posture Footer Card */}
        <div className="mt-4 p-3 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Posture State</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <p className="text-white font-semibold">Continuous Enforcement</p>
          <p className="text-[11px] text-slate-400 font-mono">
            Zero implicit standing access. Dynamic risk verified.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
