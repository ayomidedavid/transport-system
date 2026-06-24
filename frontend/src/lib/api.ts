import axios from 'axios';

// Get the API URL from environment variables, or fallback to local .NET API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5129/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('unitransit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor to handle 401s globally if needed
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    // Optionally trigger a global logout event here if the token expires
    localStorage.removeItem('unitransit_token');
    localStorage.removeItem('unitransit_user');
  }
  return Promise.reject(error);
});
