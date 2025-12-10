// Utility functions for managing temporary playlists in localStorage

const STORAGE_KEY = 'steamify_temp_playlists';

export const getLocalPlaylists = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Error reading local playlists:', err);
    return [];
  }
};

export const saveLocalPlaylist = (playlistName, trackIds, tracks = []) => {
  try {
    console.log('[saveLocalPlaylist] Saving playlist:', playlistName);
    console.log('[saveLocalPlaylist] trackIds:', trackIds);
    console.log('[saveLocalPlaylist] tracks:', tracks);
    
    const playlists = getLocalPlaylists();
    const newPlaylist = {
      playlist_id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playlist_name: playlistName,
      track_ids: trackIds,
      tracks: tracks, // Store full track details for display
      total_tracks: trackIds.length,
      total_duration_minutes: tracks.reduce((sum, t) => sum + (t.duration || t.duration_s || 0), 0) / 60,
      created_at: new Date().toISOString(),
      is_temporary: true
    };
    playlists.push(newPlaylist);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
    console.log('[saveLocalPlaylist] Saved successfully, total playlists:', playlists.length);
    return newPlaylist;
  } catch (err) {
    console.error('[saveLocalPlaylist] Error saving local playlist:', err);
    throw err;
  }
};

export const deleteLocalPlaylist = (playlistId) => {
  try {
    const playlists = getLocalPlaylists();
    const filtered = playlists.filter(p => p.playlist_id !== playlistId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Error deleting local playlist:', err);
    return false;
  }
};

export const getLocalPlaylist = (playlistId) => {
  try {
    const playlists = getLocalPlaylists();
    return playlists.find(p => p.playlist_id === playlistId) || null;
  } catch (err) {
    console.error('Error getting local playlist:', err);
    return null;
  }
};

