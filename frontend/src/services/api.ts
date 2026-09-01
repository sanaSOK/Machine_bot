import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/api`;
  }
  return import.meta.env.VITE_API_URL || '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Auto re-authenticate & retry request on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('auth_token');

      try {
        const authStore = useAuthStore();
        const success = await authStore.loginWithTelegram();
        if (success && authStore.token) {
          originalRequest.headers.Authorization = `Bearer ${authStore.token}`;
          return api(originalRequest);
        }
      } catch (retryErr) {
        console.warn('Auto re-auth retry failed:', retryErr);
      }
    }

    let errorMessage = 'An unexpected error occurred';
    if (error.response && error.response.data) {
      if (Array.isArray(error.response.data.message)) {
        errorMessage = error.response.data.message.join(', ');
      } else if (typeof error.response.data.message === 'string') {
        errorMessage = error.response.data.message;
      } else {
        errorMessage = error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    return Promise.reject(new Error(errorMessage));
  },
);

export default api;
