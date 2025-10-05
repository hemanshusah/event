import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: (refreshToken) => api.post('/api/auth/logout', { refreshToken }),
  getCurrentUser: () => api.get('/api/auth/me'),
  refreshToken: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
};

export const usersAPI = {
  getUsers: (params) => api.get('/api/users', { params }),
  getUser: (id) => api.get(`/api/users/${id}`),
  updateUser: (id, data) => api.put(`/api/users/${id}`, data),
  deactivateUser: (id) => api.patch(`/api/users/${id}/deactivate`),
  activateUser: (id) => api.patch(`/api/users/${id}/activate`),
};

export const eventsAPI = {
  getEvents: (params) => api.get('/api/events', { params }),
  getEvent: (id) => api.get(`/api/events/${id}`),
  createEvent: (data) => api.post('/api/events', data),
  updateEvent: (id, data) => api.put(`/api/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/api/events/${id}`),
};

export const startupsAPI = {
  getStartups: (params) => api.get('/api/startups', { params }),
  getStartup: (id) => api.get(`/api/startups/${id}`),
  updateStartup: (id, data) => api.put(`/api/startups/${id}`, data),
  getAccessRequests: (params) => api.get('/api/startups/access-requests', { params }),
  approveAccess: (id) => api.patch(`/api/startups/access-requests/${id}/approve`),
  denyAccess: (id) => api.patch(`/api/startups/access-requests/${id}/deny`),
};

export const investorsAPI = {
  getInvestors: (params) => api.get('/api/investors', { params }),
  getInvestor: (id) => api.get(`/api/investors/${id}`),
  updateInvestor: (id, data) => api.put(`/api/investors/${id}`, data),
  verifyInvestor: (id) => api.patch(`/api/investors/${id}/verify`),
};

export const notificationsAPI = {
  getNotifications: (params) => api.get('/api/notifications', { params }),
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/api/notifications/read-all'),
  sendBroadcast: (data) => api.post('/api/notifications/broadcast', data),
};

export const gamificationAPI = {
  getLeaderboard: (params) => api.get('/api/gamification/leaderboard', { params }),
  getUserPoints: (userId) => api.get(`/api/gamification/user/${userId}/points`),
  getSettings: () => api.get('/api/gamification/settings'),
  updateSettings: (data) => api.put('/api/gamification/settings', data),
};

export default api;
