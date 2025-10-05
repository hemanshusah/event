import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000'; // Change this to your actual API URL

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
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
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          await AsyncStorage.setItem('accessToken', accessToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
        // You might want to redirect to login screen here
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
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data) => api.put('/api/users/profile', data),
  uploadAvatar: (formData) => api.post('/api/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const eventsAPI = {
  getEvents: (params) => api.get('/api/events', { params }),
  getEvent: (id) => api.get(`/api/events/${id}`),
  rsvpEvent: (id) => api.post(`/api/events/${id}/rsvp`),
  cancelRsvp: (id) => api.delete(`/api/events/${id}/rsvp`),
  getMyEvents: () => api.get('/api/events/my-events'),
  checkIn: (id) => api.post(`/api/events/${id}/check-in`),
};

export const startupsAPI = {
  getStartups: (params) => api.get('/api/startups', { params }),
  getStartup: (id) => api.get(`/api/startups/${id}`),
  createStartup: (data) => api.post('/api/startups', data),
  updateStartup: (id, data) => api.put(`/api/startups/${id}`, data),
  uploadPitchDeck: (id, formData) => api.post(`/api/startups/${id}/pitch-deck`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  requestAccess: (startupId) => api.post(`/api/startups/${startupId}/request-access`),
  requestVDR: (startupId) => api.post(`/api/startups/${startupId}/request-vdr`),
};

export const investorsAPI = {
  getInvestors: (params) => api.get('/api/investors', { params }),
  getInvestor: (id) => api.get(`/api/investors/${id}`),
  createInvestor: (data) => api.post('/api/investors', data),
  updateInvestor: (id, data) => api.put(`/api/investors/${id}`, data),
  uploadDocuments: (formData) => api.post('/api/investors/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const notificationsAPI = {
  getNotifications: (params) => api.get('/api/notifications', { params }),
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/api/notifications/read-all'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
};

export const gamificationAPI = {
  getLeaderboard: (params) => api.get('/api/gamification/leaderboard', { params }),
  getUserPoints: () => api.get('/api/gamification/user/points'),
  getAchievements: () => api.get('/api/gamification/achievements'),
  getRanking: () => api.get('/api/gamification/ranking'),
};

export const fileAPI = {
  uploadFile: (formData) => api.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteFile: (id) => api.delete(`/api/files/${id}`),
  getFile: (id) => api.get(`/api/files/${id}`),
};

export default api;
