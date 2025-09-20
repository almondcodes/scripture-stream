import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 35000, // Increased timeout to 35 seconds to match backend
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  changePassword: (currentPassword, newPassword) => 
    api.put('/users/change-password', { currentPassword, newPassword }),
}

// Verses API
export const versesAPI = {
  getVerse: (reference, version = 'kjv') => 
    api.get(`/verses/get?reference=${encodeURIComponent(reference)}&version=${version}`),
  searchVerses: (query, version = 'kjv') => 
    api.get(`/verses/search?q=${encodeURIComponent(query)}&version=${version}`),
  getRandomVerse: (version = 'kjv') => 
    api.get(`/verses/random?version=${version}`),
  getDailyVerse: (version = 'kjv') => 
    api.get(`/verses/daily?version=${version}`),
  getVersions: () => api.get('/verses/versions'),
  getAvailableBibles: () => api.get('/verses/bibles'),
  addToFavorites: (verseData) => api.post('/verses/favorite', verseData),
  removeFromFavorites: (reference) => api.delete(`/verses/favorite/${encodeURIComponent(reference)}`),
  getFavorites: (page = 1, limit = 20) => 
    api.get(`/verses/favorites?page=${page}&limit=${limit}`),
  getHistory: (page = 1, limit = 20) => 
    api.get(`/verses/history?page=${page}&limit=${limit}`),
  addToHistory: (verseData) => api.post('/verses/history', verseData),
}

// Playlists API
export const playlistsAPI = {
  getPlaylists: (page = 1, limit = 20, includePublic = false) => 
    api.get(`/playlists?page=${page}&limit=${limit}&includePublic=${includePublic}`),
  getPlaylist: (id) => api.get(`/playlists/${id}`),
  createPlaylist: (playlistData) => api.post('/playlists', playlistData),
  updatePlaylist: (id, playlistData) => api.put(`/playlists/${id}`, playlistData),
  deletePlaylist: (id) => api.delete(`/playlists/${id}`),
  addItem: (playlistId, itemData) => api.post(`/playlists/${playlistId}/items`, itemData),
  updateItem: (playlistId, itemId, itemData) => 
    api.put(`/playlists/${playlistId}/items/${itemId}`, itemData),
  deleteItem: (playlistId, itemId) => 
    api.delete(`/playlists/${playlistId}/items/${itemId}`),
  reorderItems: (playlistId, items) => 
    api.put(`/playlists/${playlistId}/reorder`, { items }),
}

// OBS API
export const obsAPI = {
  connect: (config) => api.post('/obs/connect', config),
  sendVerse: (connectionId, verseData) => 
    api.post('/obs/send-verse', { connectionId, ...verseData }),
  getStatus: (connectionId) => api.get(`/obs/status/${connectionId}`),
  getConnections: () => api.get('/obs/connections'),
  getScenes: (connectionId) => api.get(`/obs/scenes/${connectionId}`),
  switchScene: (connectionId, sceneName) => 
    api.post('/obs/switch-scene', { connectionId, sceneName }),
  updateConnection: (id, config) => api.put(`/obs/connections/${id}`, config),
  deleteConnection: (id) => api.delete(`/obs/connections/${id}`),
  disconnect: (connectionId) => api.post(`/obs/disconnect/${connectionId}`),
}

// Templates API
export const templatesAPI = {
  getPublicTemplates: (page = 1, limit = 20) => 
    api.get(`/templates/public?page=${page}&limit=${limit}`),
  getMyTemplates: (page = 1, limit = 20) => 
    api.get(`/templates/my?page=${page}&limit=${limit}`),
  getTemplate: (id) => api.get(`/templates/${id}`),
  createTemplate: (templateData) => api.post('/templates', templateData),
  updateTemplate: (id, templateData) => api.put(`/templates/${id}`, templateData),
  deleteTemplate: (id) => api.delete(`/templates/${id}`),
  cloneTemplate: (id, name) => api.post(`/templates/${id}/clone`, { name }),
  getDefaultTemplates: () => api.get('/templates/defaults/list'),
}

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  getStats: () => api.get('/users/stats'),
  getAnalytics: (page = 1, limit = 50, action) => 
    api.get(`/users/analytics?page=${page}&limit=${limit}${action ? `&action=${action}` : ''}`),
  deleteAccount: (password) => api.delete('/users/account', { data: { password } }),
}

export default api
