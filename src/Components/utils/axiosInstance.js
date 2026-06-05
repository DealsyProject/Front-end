// utils/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://dealsy-backend-api-1.onrender.com/api',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// SIMPLIFIED interceptor - DO NOT modify the token
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Don't clean or modify - use as is
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`📤 ${config.url} → Token sent (length: ${token.length})`);
    }
    return config;
  },
  error => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.warn("401 Error on:", error.config?.url);
      console.warn("Response:", error.response?.data);
      
      // Only redirect to login for auth endpoints
      if (!error.config?.url?.includes('/auth/')) {
        // Optional: auto logout
        // localStorage.removeItem('authToken');
        // localStorage.removeItem('currentUser');
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;