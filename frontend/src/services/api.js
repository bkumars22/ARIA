import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8089/aria';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('aria_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      sessionStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
