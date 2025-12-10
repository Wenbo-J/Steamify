// API configuration
export const API_BASE_URL = 'http://localhost:5000';

export const API_ENDPOINTS = {
  // User routes
  CREATE_USER: `${API_BASE_URL}/users/`,
  GET_USER: (userId) => `${API_BASE_URL}/users/${userId}`,
  UPDATE_USER: (userId) => `${API_BASE_URL}/users/${userId}`,
  GET_USER_GAMES: (userId) => `${API_BASE_URL}/users/${userId}/games`,
  GET_USER_PLAYLISTS: (userId) => `${API_BASE_URL}/users/${userId}/playlists`,
  
  // Playlist routes
  SAVE_PLAYLIST: (playlistId) => `${API_BASE_URL}/music/playlists/${playlistId}/save`,
  DELETE_SAVED_PLAYLIST: (playlistId) => `${API_BASE_URL}/music/playlists/${playlistId}/save`,
  
  // Health check
  HEALTH_CHECK: `${API_BASE_URL}/api`,
};

