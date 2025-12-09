import React, { useState, useEffect } from 'react';
import { getUserPlaylists, getPlaylist, deletePlaylist } from '../services/api';

const UserPlaylists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId] = useState('test-user-id'); // In real app, get from auth context
  const [editingName, setEditingName] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    const loadPlaylists = async () => {
      setLoading(true);
      try {
        const data = await getUserPlaylists(userId);
        setPlaylists(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load playlists:', err);
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    };
    loadPlaylists();
  }, [userId]);

  const handlePlaylistClick = async (playlistId) => {
    try {
      const playlistData = await getPlaylist(playlistId);
      setSelectedPlaylist(playlistData);
      // Note: You'll need to implement an endpoint to get tracks in a playlist
      // For now, we'll just show the playlist info
      setPlaylistTracks([]);
    } catch (err) {
      console.error('Failed to load playlist:', err);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await deletePlaylist(playlistId);
      setPlaylists(playlists.filter(p => p.playlist_id !== playlistId));
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
      setPlaylists(playlists.map(p =>
        p.playlist_id === selectedPlaylist.playlist_id
          ? { ...p, playlist_name: newPlaylistName }
          : p
      ));
    }
    setEditingName(false);
  };

  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-[#1DB954] to-[#1B2838]">
            My Playlists
          </h1>
        <p className="text-gray-300">Manage your saved playlists</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Playlist List */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Saved Playlists</h2>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-white/5 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : playlists.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No playlists saved yet</p>
            ) : (
              <div className="space-y-2">
                {playlists.map((playlist) => (
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
                    <p className="text-sm text-gray-400">Click to view tracks</p>
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
                    <h2 className="text-2xl font-bold text-white">{selectedPlaylist.playlist_name}</h2>
                  )}
                  <p className="text-gray-400 mt-2">
                    {selectedPlaylist.total_tracks || 0} tracks • {selectedPlaylist.total_duration_minutes?.toFixed(1) || 0} minutes
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRenameStart}
                    className="btn-secondary text-sm"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(selectedPlaylist.playlist_id)}
                    className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg px-4 py-2 text-sm hover:bg-red-500/30 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {playlistTracks.length > 0 ? (
                <div className="space-y-2">
                  {playlistTracks.map((track, idx) => (
                    <div
                      key={track.track_id || idx}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <h3 className="font-semibold text-white">{track.name || 'Unknown Track'}</h3>
                      <p className="text-sm text-gray-400">{track.artists || 'Unknown Artist'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>Track list will appear here</p>
                  <p className="text-sm mt-2">(Endpoint to fetch playlist tracks needs to be implemented)</p>
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

