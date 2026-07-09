import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (API_KEY) config.headers['ndc-campaign-access-key'] = API_KEY;
    if (process.env.NEXT_PUBLIC_NGROK_SKIP) config.headers['ngrok-skip-browser-warning'] = 'true';
    const token = Cookies.get('ndc-campaign-token');
    if (token) config.headers['ndc-campaign-access-token'] = token;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('ndc-campaign-token');
      Cookies.remove('ndc-campaign-user');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('ndc-campaign-acls');

        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
