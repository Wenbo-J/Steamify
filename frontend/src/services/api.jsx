const BASE_URL = 'http://localhost:5000'; // Backend port

// Steam Routes
export const getAllGames = async () => {
  const res = await fetch(`${BASE_URL}/games/`);
  return res.json();
};

export const getGame = async (gameId) => {
  const res = await fetch(`${BASE_URL}/games/${gameId}`);
  return res.json();
};

// Spotify Routes
export const getTrack = async (trackId) => {
  const res = await fetch(`${BASE_URL}/music/track/${trackId}`);
  return res.json();
};

export const getAllTracks = async () => {
  // This would need to be implemented in backend
  const res = await fetch(`${BASE_URL}/music/tracks`);
  return res.json();
};

export const getPlaylist = async (playlistId) => {
  const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}`);
  return res.json();
};

export const createPlaylist = async (playlistName, trackIds = []) => {
  const res = await fetch(`${BASE_URL}/music/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playlist_name: playlistName, track_id: trackIds })
  });
  return res.json();
};

export const deletePlaylist = async (playlistId) => {
  const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}`, {
    method: 'DELETE'
  });
  return res.json();
};

export const addTrackToPlaylist = async (playlistId, trackId) => {
  const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ track_id: trackId })
  });
  return res.json();
};

export const removeTrackFromPlaylist = async (playlistId, trackId) => {
  const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}/tracks`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ track_id: trackId })
  });
  return res.json();
};

// Recommendation Routes
export const getGameRecommendations = async (gameId, sessionMinutes = 60, minEnergy = 0, maxEnergy = 100, minValence = 0, maxValence = 100) => {
  const params = new URLSearchParams({
    session_minutes: sessionMinutes,
    min_energy: minEnergy,
    max_energy: maxEnergy,
    min_valence: minValence,
    max_valence: maxValence
  });
  const res = await fetch(`${BASE_URL}/games/${gameId}/recommended_tracks?${params}`);
  return res.json();
};

// User Routes
export const getUserPlaylists = async (userId) => {
  const res = await fetch(`${BASE_URL}/users/${userId}/playlists`);
  return res.json();
};

export const savePlaylist = async (playlistId, userId) => {
  const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  return res.json();
};

export const unsavePlaylist = async (playlistId, userId) => {
  const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}/save`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  return res.json();
};

// Analytics Routes
export const getGenreAudioProfile = async () => {
  const res = await fetch(`${BASE_URL}/genres/steam/audio_profile`);
  return res.json();
};

export const getTopAudioGenres = async () => {
  const res = await fetch(`${BASE_URL}/genres/Spotify/topRecommendations`);
  return res.json();
};

export const getSimilarUserPlaylist = async (userId) => {
  const res = await fetch(`${BASE_URL}/playlist/similarUsers?user_id=${userId}`);
  return res.json();
};
