// Use relative URLs when in development (Vite proxy handles routing)
// Use absolute URL for production (changed to 5001 to avoid AirPlay conflict)
const BASE_URL = import.meta.env.DEV ? '' : 'http://localhost:5001';

// Helper function to handle API responses
const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || error.message || `HTTP error! status: ${res.status}`);
  }
  return res.json();
};

// Steam/Game Routes
export const getAllGames = async (limit = 50, offset = 0, search = '') => {
  try {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    if (search) params.append('search', search);
    
    const url = `${BASE_URL}/games/?${params.toString()}`;
    console.log(`Fetching games from ${url}`);
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Games response status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Games endpoint error (${res.status}):`, errorText);
      throw new Error(`Failed to fetch games: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    console.log(`Successfully fetched ${Array.isArray(data) ? data.length : 0} games`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching games:', err);
    throw err;
  }
};

export const getGame = async (gameId) => {
  try {
    const res = await fetch(`${BASE_URL}/games/${gameId}`);
    if (res.status === 404) {
      console.warn('Game endpoint not implemented yet');
      return {};
    }
    return handleResponse(res);
  } catch (err) {
    console.error('Error fetching game:', err);
    return {};
  }
};

// Spotify/Music Routes
export const getTrack = async (trackId) => {
  try {
    const res = await fetch(`${BASE_URL}/music/track/${trackId}`);
    return handleResponse(res);
  } catch (err) {
    console.error('Error fetching track:', err);
    return {};
  }
};

export const getAllTracks = async () => {
  // Note: This endpoint may not be implemented in backend
  // For now, return empty array or implement a workaround
  try {
    console.log(`Fetching tracks from ${BASE_URL}/music/tracks`);
    const res = await fetch(`${BASE_URL}/music/tracks`);
    if (res.status === 404) {
      console.warn('All tracks endpoint not implemented yet');
      return [];
    }
    if (!res.ok) {
      console.error(`Tracks endpoint error (${res.status})`);
      return [];
    }
    const data = await res.json();
    console.log(`Successfully fetched ${Array.isArray(data) ? data.length : 0} tracks`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching tracks:', err);
    return [];
  }
};

export const getPlaylist = async (playlistId) => {
  try {
    const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}`);
    return handleResponse(res);
  } catch (err) {
    console.error('Error fetching playlist:', err);
    return {};
  }
};

export const getPlaylistTracks = async (playlistId) => {
  try {
    const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}/tracks`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || error.message || `HTTP error! status: ${res.status}`);
    }
    return handleResponse(res);
  } catch (err) {
    console.error('Error fetching playlist tracks:', err);
    throw err;
  }
};

export const createPlaylist = async (playlistName, trackIds = [], userId = null) => {
  try {
    const body = { playlist_name: playlistName, track_id: trackIds };
    if (userId) {
      body.user_id = userId;
    }
    const res = await fetch(`${BASE_URL}/music/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  } catch (err) {
    console.error('Error creating playlist:', err);
    throw err;
  }
};

export const deletePlaylist = async (playlistId) => {
  try {
    const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  } catch (err) {
    console.error('Error deleting playlist:', err);
    throw err;
  }
};

export const addTrackToPlaylist = async (playlistId, trackId) => {
  try {
    const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: trackId })
    });
    return handleResponse(res);
  } catch (err) {
    console.error('Error adding track to playlist:', err);
    throw err;
  }
};

export const removeTrackFromPlaylist = async (playlistId, trackId) => {
  try {
    // Backend accepts track_id as query parameter for DELETE
    const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}/tracks?track_id=${trackId}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  } catch (err) {
    console.error('Error removing track from playlist:', err);
    throw err;
  }
};

// Recommendation Routes
// Route 6: GET /recommends/:game_id - Returns [{game_id, track_id, match_score}]
export const getRecommendations = async (gameId) => {
  try {
    console.log(`[Route 6] Fetching recommendations from ${BASE_URL}/recommends/${gameId}`);
    const res = await fetch(`${BASE_URL}/recommends/${gameId}`);
    
    console.log(`[Route 6] Response status: ${res.status}`);
    
    if (res.status === 404) {
      console.warn('[Route 6] Endpoint not found (404)');
      return { route6Empty: true, data: [] };
    }
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      console.error(`[Route 6] Error response (${res.status}):`, error);
      throw new Error(error.error || error.message || `HTTP error! status: ${res.status}`);
    }
    
    const recommendations = await res.json();
    console.log(`[Route 6] Found ${recommendations.length} recommendations from Recommendations table`);
    
    // If empty, return special flag so we know Route 6 was called but had no data
    if (!recommendations || recommendations.length === 0) {
      console.log('[Route 6] No recommendations found in Recommendations table');
      return { route6Empty: true, data: [] };
    }
    
    // Fetch full track details for each recommended track
    console.log(`[Route 6] Fetching track details for ${recommendations.length} tracks...`);
    const trackDetails = await Promise.all(
      recommendations.map(async (rec) => {
        try {
          const track = await getTrack(rec.track_id);
          return {
            ...track,
            track_id: rec.track_id,
            match_score: rec.match_score,
            game_id: rec.game_id
          };
        } catch (err) {
          console.error(`[Route 6] Error fetching track ${rec.track_id}:`, err);
          return {
            track_id: rec.track_id,
            match_score: rec.match_score,
            game_id: rec.game_id,
            name: 'Unknown Track'
          };
        }
      })
    );
    
    console.log(`[Route 6] Successfully fetched ${trackDetails.length} track details`);
    return { route6Empty: false, data: trackDetails };
  } catch (err) {
    console.error('[Route 6] Error:', err);
    // Return error flag so frontend knows Route 6 failed
    return { route6Error: true, error: err.message, data: [] };
  }
};

// Route 12.1: GET /games/:game_id/recommended_tracks - Full track details with filters
export const getGameRecommendations = async (gameId, sessionMinutes = 60, minEnergy = 0, maxEnergy = 100, minValence = 0, maxValence = 100) => {
  try {
    const params = new URLSearchParams({
      session_minutes: sessionMinutes,
      min_energy: minEnergy,
      max_energy: maxEnergy,
      min_valence: minValence,
      max_valence: maxValence
    });
    const res = await fetch(`${BASE_URL}/games/${gameId}/recommended_tracks?${params}`);
    if (res.status === 404) {
      console.warn('Recommended tracks endpoint not found, trying Route 6...');
      // Fallback to Route 6
      return await getRecommendations(gameId);
    }
    return handleResponse(res);
  } catch (err) {
    console.error('Error fetching game recommendations:', err);
    // Fallback to Route 6
    return await getRecommendations(gameId);
  }
};

// User Routes
export const getUserPlaylists = async (userId) => {
  try {
    const res = await fetch(`${BASE_URL}/users/${userId}/playlists`);
    return handleResponse(res);
  } catch (err) {
    console.error('Error fetching user playlists:', err);
    return [];
  }
};

export const savePlaylist = async (playlistId, userId) => {
  try {
    const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    return handleResponse(res);
  } catch (err) {
    console.error('Error saving playlist:', err);
    throw err;
  }
};

export const unsavePlaylist = async (playlistId, userId) => {
  try {
    const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}/save`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    return handleResponse(res);
  } catch (err) {
    console.error('Error unsaving playlist:', err);
    throw err;
  }
};

// Analytics Routes
export const getGenreAudioProfile = async () => {
  try {
    const res = await fetch(`${BASE_URL}/analytics/genres/audio_profile`);
    if (res.status === 404) {
      console.warn('Genre audio profile endpoint not found');
      return [];
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || error.message || `HTTP error! status: ${res.status}`);
    }
    return handleResponse(res);
  } catch (err) {
    console.error('Error fetching genre audio profile:', err);
    return [];
  }
};

export const getTopAudioGenres = async () => {
  try {
    const res = await fetch(`${BASE_URL}/analytics/genres/top_pairs`);
    if (res.status === 404) {
      console.warn('Top genre pairs endpoint not found');
      return [];
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || error.message || `HTTP error! status: ${res.status}`);
    }
    return handleResponse(res);
  } catch (err) {
    console.error('Error fetching top genre pairs:', err);
    return [];
  }
};

export const getSimilarUserPlaylist = async (userId) => {
  try {
    const res = await fetch(`${BASE_URL}/analytics/social/recommendations?user_id=${userId}`);
    if (res.status === 404) {
      console.warn('Social recommendations endpoint not found');
      return [];
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || error.message || `HTTP error! status: ${res.status}`);
    }
    return handleResponse(res);
  } catch (err) {
    console.error('Error fetching social recommendations:', err);
    return [];
  }
};

// Additional analytics route: Search songs for a game (uses Recommendations table with proper duration filtering)
export const searchSongs = async (gameName, sessionDurationSeconds = 1800, minEnergy = 0, maxEnergy = 100, minValence = 0, maxValence = 100) => {
  try {
    const params = new URLSearchParams({
      game_name: gameName,
      session_duration_s: sessionDurationSeconds.toString(),
      min_energy: minEnergy.toString(),
      max_energy: maxEnergy.toString(),
      min_valence: minValence.toString(),
      max_valence: maxValence.toString()
    });
    const res = await fetch(`${BASE_URL}/analytics/search/songs?${params}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || error.message || `HTTP error! status: ${res.status}`);
    }
    return handleResponse(res);
  } catch (err) {
    console.error('Error searching songs:', err);
    throw err;
  }
};

// Authentication Routes - Google OAuth only
export const googleAuth = async (email, name, picture, googleId) => {
  try {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, picture, google_id: googleId })
    });
    return handleResponse(res);
  } catch (err) {
    console.error('Error with Google auth:', err);
    throw err;
  }
};

// Link Steam account (optional)
export const linkSteamAccount = async (userId, steamId, steamName) => {
  try {
    const res = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steam_id: steamId, steam_name: steamName })
    });
    return handleResponse(res);
  } catch (err) {
    console.error('Error linking Steam account:', err);
    throw err;
  }
};

// Link Spotify account (optional)
export const linkSpotifyAccount = async (userId, spotifyId, spotifyName) => {
  try {
    const res = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotify_id: spotifyId, spotify_name: spotifyName })
    });
    return handleResponse(res);
  } catch (err) {
    console.error('Error linking Spotify account:', err);
    throw err;
  }
};
