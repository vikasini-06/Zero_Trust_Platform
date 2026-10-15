import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [device, setDevice] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('zerotrust_token') || null);
  const [loading, setLoading] = useState(true);
  const [sessionRevokedNotice, setSessionRevokedNotice] = useState(null);

  // Initialize socket client
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const rawApiUrl = import.meta.env.VITE_API_BASE_URL;
    const socketOrigin = rawApiUrl
      ? rawApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')
      : window.location.origin;

    const s = io(socketOrigin, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Listen for socket events related to current session
  useEffect(() => {
    if (!socket || !session?.sessionId) return;

    const eventName = `session_revoked_${session.sessionId}`;
    const handleRevoked = (data) => {
      setSessionRevokedNotice(data.reason || 'Session was forcefully revoked by administrator');
      logout();
    };

    socket.on(eventName, handleRevoked);

    return () => {
      socket.off(eventName, handleRevoked);
    };
  }, [socket, session?.sessionId]);

  // Listen for custom session termination event from axios interceptor
  useEffect(() => {
    const handleTerminated = (e) => {
      setSessionRevokedNotice(e.detail?.message || 'Access revoked: Session invalid');
      logout();
    };

    window.addEventListener('zerotrust:session_terminated', handleTerminated);
    return () => {
      window.removeEventListener('zerotrust:session_terminated', handleTerminated);
    };
  }, []);

  // Load user profile on startup if token exists
  useEffect(() => {
    const loadSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.success && response.data) {
          setUser(response.data.user);
          setDevice(response.data.device);
          setSession(response.data.session);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [token]);

  const login = async (email, password, mfaToken = null) => {
    const response = await api.post('/auth/login', { email, password, mfaToken });
    if (response.mfaRequired) {
      return { mfaRequired: true, tempToken: response.tempToken, device: response.device };
    }

    if (response.success && response.data) {
      const { token: authToken, user: userData, session: sessionData, device: deviceData } = response.data;
      localStorage.setItem('zerotrust_token', authToken);
      if (sessionData?.sessionId) {
        localStorage.setItem('zerotrust_session_id', sessionData.sessionId);
      }

      setToken(authToken);
      setUser(userData);
      setSession(sessionData);
      setDevice(deviceData);
      setSessionRevokedNotice(null);
      return { success: true };
    }

    return response;
  };

  const verifyMfaLogin = async (tempToken, code) => {
    const response = await api.post('/auth/verify-mfa', { tempToken, code });
    if (response.success && response.data) {
      const { token: authToken, user: userData, session: sessionData, device: deviceData } = response.data;
      localStorage.setItem('zerotrust_token', authToken);
      if (sessionData?.sessionId) {
        localStorage.setItem('zerotrust_session_id', sessionData.sessionId);
      }

      setToken(authToken);
      setUser(userData);
      setSession(sessionData);
      setDevice(deviceData);
      setSessionRevokedNotice(null);
      return { success: true };
    }
    return response;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.success && response.data) {
      const { token: authToken, user: newUser, session: sessionData, device: deviceData } = response.data;
      localStorage.setItem('zerotrust_token', authToken);
      if (sessionData?.sessionId) {
        localStorage.setItem('zerotrust_session_id', sessionData.sessionId);
      }

      setToken(authToken);
      setUser(newUser);
      setSession(sessionData);
      setDevice(deviceData);
      return { success: true };
    }
    return response;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout').catch(() => {});
      }
    } finally {
      localStorage.removeItem('zerotrust_token');
      localStorage.removeItem('zerotrust_session_id');
      setToken(null);
      setUser(null);
      setSession(null);
      setDevice(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.success && response.data) {
        setUser(response.data.user);
        setDevice(response.data.device);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        device,
        token,
        loading,
        socket,
        sessionRevokedNotice,
        setSessionRevokedNotice,
        login,
        verifyMfaLogin,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
