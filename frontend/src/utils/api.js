import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true // Make sure this is set to true
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getGoogleAuthUrl: () => api.get('/api/auth/google'),
  getGithubAuthUrl: () => api.get('/api/auth/github'),
  handleCallback: (provider, code) => api.post(`/api/auth/${provider}/callback`, { code })
};

export const userApi = {
  getProfile: () => api.get('/api/users/me'),
  updateProfile: (id, data) => api.put(`/api/users/${id}`, data),
  getAllUsers: () => api.get('/api/users'),
  getLeaderboard: () => api.get('/api/leaderboard')
};

export default api;