import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL ?? 'http://localhost:8081/api',
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  if (
    config.url?.includes('/auth/register') ||
    config.url?.includes('/auth/login')
  ) {
    return config;
  }

  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Basic ${token}`;
  }
  return config;
});
