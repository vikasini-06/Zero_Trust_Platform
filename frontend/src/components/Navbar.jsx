import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import {
  Shield,
  Bell,
  LogOut,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import SecurityBadge from './SecurityBadge';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, device, logout, socket } = useAuth();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    // Fetch initial active alert count
    const fetchAlertStats = async () => {
      try {
        const res = await api.get('/alerts/stats').catch(() => null);
        if (res?.success && res.data) {
          setAlertCount(res.data.status?.open || 0);
        }
      } catch (err) {}
    };

    fetchAlertStats();

    // Listen for new alerts via socket
    if (socket) {
      socket.on('new_security_alert', () => {
        setAlertCount((prev) => prev + 1);
      });
    }

    return () => {
      if (socket) {
        socket.off('new_security_alert');
      }
    };
  }, [socket]);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0a0d14]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-black font-extrabold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">ZeroTrust</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold uppercase">
                Enterprise
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              "Never Trust. Always Verify."
            </p>
          </div>
        </Link>
      </div>

      {/* Center: Live SOC Telemetry Status */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-xs font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-400">SOC Telemetry:</span>
        <span className="text-emerald-400 font-semibold">CONTINUOUS VERIFICATION ACTIVE</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Device Posture Pill */}
        {device && (
          <Link
            to="/devices"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-xs transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-mono">Device:</span>
            <SecurityBadge status={device.status || 'Trusted'} size="sm" />
          </Link>
        )}

        {/* Security Alerts Bell */}
        <Link
          to="/security"
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
          title="Security Alerts"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center animate-bounce shadow-lg shadow-rose-500/30">
              {alertCount}
            </span>
          )}
        </Link>

        {/* User Card & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-white leading-tight">{user?.name}</p>
            <span className="text-[10px] font-mono text-cyan-400">{user?.roleName || user?.role}</span>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
