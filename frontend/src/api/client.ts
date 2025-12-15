import axios from 'axios';

const api = axios.create({
  // In Docker we proxy /api to backend via nginx; fallback keeps dev working.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 8000,
});

export function setAuthToken(token?: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
