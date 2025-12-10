import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserPlaylists, getPlaylist, getPlaylistTracks, deletePlaylist, createPlaylist } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getLocalPlaylists, deleteLocalPlaylist, getLocalPlaylist } from '../utils/localPlaylists';

const UserPlaylists = () => {
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [tempPlaylists, setTempPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const userId = user?.user_id;
  const [editingName, setEditingName] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [savingPlaylist, setSavingPlaylist] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPlaylists = async () => {
      setLoading(true);
      try {
        // Load saved playlists if authenticated
        if (isAuthenticated && userId) {
          const data = await getUserPlaylists(userId);
          setSavedPlaylists(Array.isArray(data) ? data : []);
        } else {
          setSavedPlaylists([]);
        }
        
        // Always load temporary playlists
        const localPlaylists = getLocalPlaylists();
        setTempPlaylists(localPlaylists);
      } catch (err) {
        console.error('Failed to load playlists:', err);
        setSavedPlaylists([]);
      } finally {
        setLoading(false);
      }
    };
    loadPlaylists();
  }, [userId, isAuthenticated]);

  // Refresh temp playlists when component mounts or when returning from other pages
  useEffect(() => {
    const refreshTemp = () => {
      const localPlaylists = getLocalPlaylists();
      setTempPlaylists(localPlaylists);
    };
    refreshTemp();
    // Refresh every 2 seconds to catch changes from other tabs
    const interval = setInterval(refreshTemp, 2000);
    return () => clearInterval(interval);
  }, []);

  const handlePlaylistClick = async (playlistId) => {
    try {
      if (playlistId.startsWith('temp_')) {
        // Temporary playlist
        const localPlaylist = getLocalPlaylist(playlistId);
        if (localPlaylist) {
          setSelectedPlaylist(localPlaylist);
          setPlaylistTracks(localPlaylist.tracks || []);
        }
      } else {
        // Saved playlist - fetch both playlist info and tracks
        const [playlistData, tracksData] = await Promise.all([
          getPlaylist(playlistId),
          getPlaylistTracks(playlistId)
        ]);
        setSelectedPlaylist(playlistData);
        setPlaylistTracks(Array.isArray(tracksData) ? tracksData : []);
      }
    } catch (err) {
      console.error('Failed to load playlist:', err);
      setPlaylistTracks([]);
    }
  };

  const handleSaveTempPlaylist = async (tempPlaylist) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/playlists' } } });
      return;
    }
    
    setSavingPlaylist(true);
    try {
      const result = await createPlaylist(tempPlaylist.playlist_name, tempPlaylist.track_ids, userId);
      if (result.playlist_id) {
        // Delete from local storage
        deleteLocalPlaylist(tempPlaylist.playlist_id);
        // Reload playlists
        const data = await getUserPlaylists(userId);
        setSavedPlaylists(Array.isArray(data) ? data : []);
        const localPlaylists = getLocalPlaylists();
        setTempPlaylists(localPlaylists);
        setSelectedPlaylist(null);
        setPlaylistTracks([]);
        alert('Playlist saved to your account!');
      }
    } catch (err) {
      console.error('Failed to save playlist:', err);
      alert('Failed to save playlist: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingPlaylist(false);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      if (playlistId.startsWith('temp_')) {
        // Delete temporary playlist
        deleteLocalPlaylist(playlistId);
        setTempPlaylists(tempPlaylists.filter(p => p.playlist_id !== playlistId));
      } else {
        // Delete saved playlist
        await deletePlaylist(playlistId);
        setSavedPlaylists(savedPlaylists.filter(p => p.playlist_id !== playlistId));
      }
      if (selectedPlaylist?.playlist_id === playlistId) {
        setSelectedPlaylist(null);
        setPlaylistTracks([]);
      }
    } catch (err) {
      console.error('Failed to delete playlist:', err);
      alert('Failed to delete playlist');
    }
  };

  const handleRenameStart = () => {
    setNewPlaylistName(selectedPlaylist?.playlist_name || '');
    setEditingName(true);
  };

  const handleRenameSave = async () => {
    // Note: You'll need to implement a PATCH endpoint for renaming
    // For now, just update locally
    if (selectedPlaylist) {
      setSelectedPlaylist({ ...selectedPlaylist, playlist_name: newPlaylistName });
      if (selectedPlaylist.is_temporary) {
        // Update temporary playlist
        const updated = tempPlaylists.map(p =>
          p.playlist_id === selectedPlaylist.playlist_id
            ? { ...p, playlist_name: newPlaylistName }
            : p
        );
        setTempPlaylists(updated);
        localStorage.setItem('steamify_temp_playlists', JSON.stringify(updated));
      } else {
        // Update saved playlist
        const updated = savedPlaylists.map(p =>
          p.playlist_id === selectedPlaylist.playlist_id
            ? { ...p, playlist_name: newPlaylistName }
            : p
        );
        setSavedPlaylists(updated);
      }
    }
    setEditingName(false);
  };

  const allPlaylists = [...savedPlaylists, ...tempPlaylists];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl md:text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-[#1DB954] to-[#1B2838]">
          My Playlists
        </h1>
        <p className="text-gray-300">
          {isAuthenticated ? 'Manage your saved and temporary playlists' : 'View your temporary playlists (sign in to save permanently)'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Playlist List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Saved Playlists */}
          {isAuthenticated && (
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold mb-4 text-white">Saved Playlists</h2>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-16 bg-white/5 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : savedPlaylists.length === 0 ? (
                <p className="text-gray-400 text-center py-8 text-sm">No saved playlists</p>
              ) : (
                <div className="space-y-2">
                  {savedPlaylists.map((playlist) => (
                    <div
                      key={playlist.playlist_id}
                      onClick={() => handlePlaylistClick(playlist.playlist_id)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedPlaylist?.playlist_id === playlist.playlist_id
                          ? 'bg-gradient-to-r from-[#1DB954]/30 to-[#1B2838]/30 border-2 border-[#1DB954]'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <h3 className="font-semibold text-white">{playlist.playlist_name}</h3>
                      
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Temporary Playlists */}
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-4 text-white">
              Temporary Playlists
              <span className="ml-2 text-xs text-yellow-400">⚠️ Lost on refresh</span>
            </h2>
            {tempPlaylists.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">No temporary playlists</p>
            ) : (
              <div className="space-y-2">
                {tempPlaylists.map((playlist) => (
                  <div
                    key={playlist.playlist_id}
                    onClick={() => handlePlaylistClick(playlist.playlist_id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedPlaylist?.playlist_id === playlist.playlist_id
                        ? 'bg-gradient-to-r from-yellow-500/30 to-[#1B2838]/30 border-2 border-yellow-500'
                        : 'bg-white/5 border border-yellow-500/30 hover:bg-white/10'
                    }`}
                  >
                    <h3 className="font-semibold text-white">{playlist.playlist_name}</h3>
                    <p className="text-sm text-gray-400">{playlist.total_tracks || 0} tracks</p>
                    {!isAuthenticated && (
                      <p className="text-xs text-yellow-400 mt-1">Sign in to save</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Playlist Details */}
        <div className="lg:col-span-2">
          {selectedPlaylist ? (
            <div className="glass-panel p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  {editingName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-xl font-bold"
                        autoFocus
                      />
                      <button
                        onClick={handleRenameSave}
                        className="btn-primary"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingName(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedPlaylist.playlist_name}</h2>
                      {selectedPlaylist.is_temporary && (
                        <span className="inline-block mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-semibold">
                          ⚠️ Temporary (lost on refresh)
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-gray-400 mt-2">
                    {selectedPlaylist.total_tracks || 0} tracks • {selectedPlaylist.total_duration_minutes?.toFixed(1) || 0} minutes
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedPlaylist.is_temporary && isAuthenticated && (
                    <button
                      onClick={() => handleSaveTempPlaylist(selectedPlaylist)}
                      disabled={savingPlaylist}
                      className="btn-primary text-sm"
                    >
                      {savingPlaylist ? 'Saving...' : 'Save to Account'}
                    </button>
                  )}
                  {selectedPlaylist.is_temporary && !isAuthenticated && (
                    <button
                      onClick={() => navigate('/login', { state: { from: { pathname: '/playlists' } } })}
                      className="btn-primary text-sm"
                    >
                      Sign In to Save
                    </button>
                  )}
                  {!selectedPlaylist.is_temporary && (
                    <button
                      onClick={handleRenameStart}
                      className="btn-secondary text-sm"
                    >
                      Rename
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePlaylist(selectedPlaylist.playlist_id)}
                    className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg px-4 py-2 text-sm hover:bg-red-500/30 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {playlistTracks.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div className="text-sm text-gray-400 mb-2 px-2">
                    {playlistTracks.length} {playlistTracks.length === 1 ? 'track' : 'tracks'}
                  </div>
                  {playlistTracks.map((track, idx) => (
                    <div
                      key={track.track_id || idx}
                      className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:border-[#1DB954]/30 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{track.name || 'Unknown Track'}</h3>
                          <p className="text-sm text-gray-400 mt-1">{track.artists || 'Unknown Artist'}</p>
                          {track.genres && (
                            <p className="text-xs text-gray-500 mt-1">{track.genres}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-4">
                          {track.duration && (
                            <span className="text-xs text-gray-500 font-mono">
                              {Math.floor(track.duration / 60)}:{(track.duration % 60).toFixed(0).padStart(2, '0')}
                            </span>
                          )}
                          {track.popularity && (
                            <span className="text-xs text-[#1DB954]">
                              Popularity: {track.popularity}
                            </span>
                          )}
                        </div>
                      </div>
                      {(track.energy || track.valence) && (
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          {track.energy !== undefined && <span>Energy: {track.energy.toFixed(2)}</span>}
                          {track.valence !== undefined && <span>Valence: {track.valence.toFixed(2)}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : selectedPlaylist.is_temporary ? (
                <div className="text-center py-12 text-gray-400">
                  <p>No tracks in this playlist</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>Loading tracks...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-12 flex items-center justify-center min-h-[400px]">
              <div className="text-center text-gray-400">
                <p className="text-xl mb-2">Select a playlist</p>
                <p className="text-sm">Choose a playlist from the list to view its tracks</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPlaylists;

