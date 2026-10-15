import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MfaVerification from './pages/MfaVerification';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import ResourceDetails from './pages/ResourceDetails';
import AccessRequests from './pages/AccessRequests';
import Devices from './pages/Devices';
import Sessions from './pages/Sessions';
import Security from './pages/Security';
import Alerts from './pages/Alerts';
import Users from './pages/Users';
import Roles from './pages/Roles';
import AuditLogs from './pages/AuditLogs';
import MfaSetup from './pages/MfaSetup';
import Settings from './pages/Settings';

import { AlertTriangle, X } from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sessionRevokedNotice, setSessionRevokedNotice } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col text-slate-100 font-sans antialiased">
      {/* Session Revocation Alert Banner */}
      {sessionRevokedNotice && (
        <div className="bg-rose-500 text-white px-4 py-2.5 text-xs font-mono flex items-center justify-between shadow-lg sticky top-0 z-50 animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-bounce" />
            <span className="font-bold">Zero Trust Perimeter Severance:</span>
            <span>{sessionRevokedNotice}</span>
          </div>
          <button
            onClick={() => setSessionRevokedNotice(null)}
            className="p-1 hover:bg-rose-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/mfa-verification" element={<MfaVerification />} />

          {/* Authenticated Application Routes with App Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <Layout>
                  <Resources />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/resources/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ResourceDetails />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/access-requests"
            element={
              <ProtectedRoute>
                <Layout>
                  <AccessRequests />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/devices"
            element={
              <ProtectedRoute>
                <Layout>
                  <Devices />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <Layout>
                  <Sessions />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/mfa-setup"
            element={
              <ProtectedRoute>
                <Layout>
                  <MfaSetup />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/security"
            element={
              <ProtectedRoute roles={['Security Admin', 'Super Admin']}>
                <Layout>
                  <Security />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/alerts"
            element={
              <ProtectedRoute roles={['Security Admin', 'Super Admin']}>
                <Layout>
                  <Alerts />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['Manager', 'Security Admin', 'Super Admin']}>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute roles={['Super Admin']}>
                <Layout>
                  <Roles />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/devices"
            element={
              <ProtectedRoute roles={['Security Admin', 'Super Admin']}>
                <Layout>
                  <Devices />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/sessions"
            element={
              <ProtectedRoute roles={['Security Admin', 'Super Admin']}>
                <Layout>
                  <Sessions />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/access-requests"
            element={
              <ProtectedRoute roles={['Manager', 'Security Admin', 'Super Admin']}>
                <Layout>
                  <AccessRequests />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute roles={['Security Admin', 'Super Admin']}>
                <Layout>
                  <AuditLogs />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute roles={['Super Admin']}>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Root Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
