import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add Authorization token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Dashboard APIs
export const getCases = () => api.get('/cases');
export const getDocuments = () => api.get('/documents');
export const getUpcomingAppointments = () => api.get('/appointments/upcoming');
export const getTasks = () => api.get('/tasks');

export default api;
