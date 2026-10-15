import axios from 'axios';

// Get or generate persistent privacy-conscious device ID for current browser client
const getClientDeviceId = () => {
  let devId = localStorage.getItem('zerotrust_device_id');
  if (!devId) {
    devId = 'dev_client_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4);
    localStorage.setItem('zerotrust_device_id', devId);
  }
  return devId;
};

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('zerotrust_token');
    const sessionId = localStorage.getItem('zerotrust_session_id');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (sessionId) {
      config.headers['x-session-id'] = sessionId;
    }

    config.headers['x-device-id'] = getClientDeviceId();
    config.headers['x-device-name'] = navigator.userAgent.includes('Windows')
      ? 'Windows Enterprise Workstation'
      : navigator.userAgent.includes('Mac')
      ? 'macOS Production Laptop'
      : 'Enterprise Terminal';
    config.headers['x-client-location'] = 'US West Region (Corporate Mesh)';

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      // Handle session revocation or authentication expiry
      if (status === 401 && (data.errorCode === 'SESSION_REVOKED' || data.errorCode === 'TOKEN_INVALID')) {
        window.dispatchEvent(
          new CustomEvent('zerotrust:session_terminated', {
            detail: { message: data.message || 'Session terminated by security policy' },
          })
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;
