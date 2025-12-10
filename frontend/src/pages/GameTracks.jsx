import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRecommendations, createPlaylist, getTrack } from '../services/api';
import { saveLocalPlaylist, getLocalPlaylists, deleteLocalPlaylist } from '../utils/localPlaylists';

const GameTracks = () => {
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const game = location.state?.game;

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    sessionMinutes: 60,
    minEnergy: 0,
    maxEnergy: 100,
    minValence: 0,
    maxValence: 100
  });
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [playlistName, setPlaylistName] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [selectedTrackDetail, setSelectedTrackDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('tracks'); // 'tracks' or 'playlists'
  const [createdPlaylists, setCreatedPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (gameId) {
      handleGenerate();
    }
    // Load created playlists on mount
    refreshPlaylists();
  }, [gameId]);

  const refreshPlaylists = () => {
    const playlists = getLocalPlaylists();
    setCreatedPlaylists(playlists);
    console.log('Refreshed playlists:', playlists.length);
  };

  // Debug: Log when activeTab changes
  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
  }, [activeTab]);

  const handleGenerate = async () => {
    if (!gameId) return;
    setLoading(true);
    try {
      // Use Route 6 only - fetch recommendations
      const result = await getRecommendations(gameId);
      let tracks = result?.data || [];
      
      // Filter by session duration - accumulate track durations until we reach target
      if (tracks.length > 0) {
        const targetSeconds = filters.sessionMinutes * 60;
        let totalDuration = 0;
        const filtered = [];
        
        for (const track of tracks) {
          const duration = track.duration || track.track_duration_s || 0;
          if (totalDuration + duration <= targetSeconds) {
            filtered.push(track);
            totalDuration += duration;
          } else {
            break;
          }
        }
        
        tracks = filtered;
      }
      
      setRecommendations(tracks);
      setSelectedTracks(new Set());
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrackSelection = (trackId) => {
    console.log('[toggleTrackSelection] Toggling track:', trackId);
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
      console.log('[toggleTrackSelection] Removed, new size:', newSelected.size);
    } else {
      newSelected.add(trackId);
      console.log('[toggleTrackSelection] Added, new size:', newSelected.size);
    }
    setSelectedTracks(newSelected);
  };

  const handleCreatePlaylist = async () => {
    console.log('[handleCreatePlaylist] Called');
    console.log('[handleCreatePlaylist] playlistName:', playlistName);
    console.log('[handleCreatePlaylist] selectedTracks:', selectedTracks);
    console.log('[handleCreatePlaylist] selectedTracks.size:', selectedTracks.size);
    
    if (!playlistName.trim() || selectedTracks.size === 0) {
      alert('Please enter a playlist name and select at least one track');
      return;
    }
    
    setCreatingPlaylist(true);
    try {
      const trackIds = Array.from(selectedTracks);
      console.log('[handleCreatePlaylist] trackIds:', trackIds);
      console.log('[handleCreatePlaylist] recommendations:', recommendations.length);
      
      // Get full track details for the selected tracks
      // Try multiple ways to match tracks
      const selectedTrackDetails = recommendations.filter(t => {
        const trackId = t.track_id || t.id;
        const matches = trackIds.includes(trackId) || 
                       trackIds.some(id => String(id) === String(trackId));
        return matches;
      });
      
      console.log('[handleCreatePlaylist] selectedTrackDetails:', selectedTrackDetails.length);
      console.log('[handleCreatePlaylist] First recommendation sample:', recommendations[0]);
      console.log('[handleCreatePlaylist] First selectedTrackDetail sample:', selectedTrackDetails[0]);
      
      // If we can't find all track details, that's okay - we'll store what we have
      if (selectedTrackDetails.length < trackIds.length) {
        console.warn(`[handleCreatePlaylist] Only found ${selectedTrackDetails.length} out of ${trackIds.length} track details`);
      }
      
      if (isAuthenticated) {
        // User is authenticated - save to server
        console.log('[handleCreatePlaylist] User authenticated, saving to server');
        const userId = user?.user_id;
        console.log('[handleCreatePlaylist] User ID:', userId);
        if (!userId) {
          throw new Error('User ID not found. Please sign in again.');
        }
        const result = await createPlaylist(playlistName, trackIds, userId);
        console.log('[handleCreatePlaylist] Server result:', result);
        if (result.playlist_id) {
          // Also save locally for display
          const localPlaylist = saveLocalPlaylist(playlistName, trackIds, selectedTrackDetails);
          console.log('[handleCreatePlaylist] Saved locally:', localPlaylist);
          refreshPlaylists();
          setPlaylistName('');
          setSelectedTracks(new Set());
          setActiveTab('playlists'); // Switch to playlists tab
          setSelectedPlaylist(localPlaylist);
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000);
        } else {
          console.error('[handleCreatePlaylist] Server did not return playlist_id');
          alert('Failed to create playlist: Server did not return a playlist ID');
        }
      } else {
        // User is not authenticated - save locally
        console.log('[handleCreatePlaylist] User not authenticated, saving locally');
        const localPlaylist = saveLocalPlaylist(playlistName, trackIds, selectedTrackDetails);
        console.log('[handleCreatePlaylist] Local playlist saved:', localPlaylist);
        refreshPlaylists();
        setPlaylistName('');
        setSelectedTracks(new Set());
        setActiveTab('playlists'); // Switch to playlists tab
        setSelectedPlaylist(localPlaylist);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (err) {
      console.error('[handleCreatePlaylist] Error:', err);
      console.error('[handleCreatePlaylist] Error stack:', err.stack);
      alert('Failed to create playlist: ' + (err.message || 'Unknown error'));
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const handleDeletePlaylist = (playlistId) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    deleteLocalPlaylist(playlistId);
    refreshPlaylists();
    if (selectedPlaylist?.playlist_id === playlistId) {
      setSelectedPlaylist(null);
    }
  };

  const handleTrackClick = async (trackId) => {
    try {
      const trackData = await getTrack(trackId);
      setSelectedTrackDetail(trackData);
    } catch (err) {
      console.error('Failed to load track details:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-24 right-6 z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-[#1DB954]/90 to-[#1B2838]/90 border border-[#1DB954] rounded-lg p-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1DB954] rounded-full flex items-center justify-center">
                <span className="text-white text-xl">✓</span>
              </div>
              <div>
                <p className="text-white font-semibold">Playlist Created!</p>
                <p className="text-gray-300 text-sm">
                  {isAuthenticated ? 'Saved to your account' : 'Saved temporarily (sign in to save permanently)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white mb-4 inline-flex items-center gap-2 transition-colors"
          >
            <span>&larr;</span> Back to Games
          </button>
          <h1 className="text-4xl md:text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#1DB954] via-white to-[#1B2838]">
            {game?.name || 'Game Tracks'}
          </h1>
          <p className="text-gray-300">Recommended Spotify tracks for your gaming session</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Filters */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4 text-white">Filters</h2>
            <div className="space-y-4">
              <div>
                <label className="text-label block mb-2">Session Duration (minutes)</label>
                <input
                  type="number"
                  min="10"
                  max="240"
                  value={filters.sessionMinutes}
                  onChange={(e) => setFilters({ ...filters, sessionMinutes: parseInt(e.target.value) || 60 })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                />
              </div>
              <div>
                <label className="text-label block mb-2">Min Energy: {filters.minEnergy}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minEnergy}
                  onChange={(e) => setFilters({ ...filters, minEnergy: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-label block mb-2">Max Energy: {filters.maxEnergy}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.maxEnergy}
                  onChange={(e) => setFilters({ ...filters, maxEnergy: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-label block mb-2">Min Valence: {filters.minValence}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minValence}
                  onChange={(e) => setFilters({ ...filters, minValence: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-label block mb-2">Max Valence: {filters.maxValence}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.maxValence}
                  onChange={(e) => setFilters({ ...filters, maxValence: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? 'Generating...' : 'Apply Filters'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Tracks or Playlists */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tabs - Made more visible */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-1">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('tracks')}
                className={`flex-1 py-3 px-4 font-semibold transition-all rounded-lg ${
                  activeTab === 'tracks'
                    ? 'bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80 text-white shadow-lg shadow-[#1DB954]/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Recommended Tracks ({recommendations.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('playlists');
                  refreshPlaylists();
                }}
                className={`flex-1 py-3 px-4 font-semibold transition-all rounded-lg ${
                  activeTab === 'playlists'
                    ? 'bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80 text-white shadow-lg shadow-[#1DB954]/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                My Playlists ({createdPlaylists.length})
              </button>
            </div>
          </div>

          {activeTab === 'tracks' ? (
          <div className="glass-panel p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Generating recommendations...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <p className="text-xl mb-2">No recommendations found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    {recommendations.length} Recommended Tracks
                  </h2>
                  {selectedTracks.size > 0 && (
                    <span className="text-sm text-[#1DB954] font-semibold">
                      {selectedTracks.size} selected
                    </span>
                  )}
                </div>

                {/* Playlist Creation */}
                {selectedTracks.size > 0 && (
                  <div className="bg-gradient-to-r from-[#1DB954]/10 to-[#1B2838]/10 border border-[#1DB954]/30 rounded-lg p-4 mb-4">
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-label block mb-2">Playlist Name</label>
                        <input
                          type="text"
                          value={playlistName}
                          onChange={(e) => setPlaylistName(e.target.value)}
                          placeholder="Enter playlist name..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                        />
                        {!isAuthenticated && (
                          <p className="text-xs text-gray-400 mt-1">
                            ⚠️ Playlist will be temporary (lost on page refresh). Sign in to save permanently.
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('[Button] Create playlist clicked');
                          console.log('[Button] playlistName:', playlistName);
                          console.log('[Button] selectedTracks.size:', selectedTracks.size);
                          console.log('[Button] creatingPlaylist:', creatingPlaylist);
                          handleCreatePlaylist();
                        }}
                        disabled={creatingPlaylist || !playlistName.trim()}
                        className="btn-primary"
                      >
                        {creatingPlaylist ? 'Creating...' : isAuthenticated ? `Save (${selectedTracks.size})` : `Create Temp (${selectedTracks.size})`}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {recommendations.map((track, idx) => (
                    <div
                      key={track.track_id || idx}
                      className={`p-4 rounded-lg border transition-all cursor-pointer group ${
                        selectedTracks.has(track.track_id)
                          ? 'bg-gradient-to-r from-[#1DB954]/20 to-[#1B2838]/20 border-[#1DB954]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#1DB954]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTrackSelection(track.track_id);
                            }}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                              selectedTracks.has(track.track_id)
                                ? 'bg-[#1DB954] border-[#1DB954]'
                                : 'border-white/30 hover:border-[#1DB954]'
                            }`}
                          >
                            {selectedTracks.has(track.track_id) && (
                              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold text-white mb-1 hover:text-[#1DB954] transition-colors cursor-pointer"
                              onClick={() => handleTrackClick(track.track_id)}
                            >
                              {track.track_name || track.name}
                            </h3>
                            <p className="text-sm text-gray-400">
                              Energy: {track.energy} | Valence: {track.valence} | Match Score: {track.match_score}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 font-mono">
                            {Math.floor((track.duration || 0) / 60)}:{(track.duration || 0) % 60}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          ) : (
          <div className="glass-panel p-6">
            {createdPlaylists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <p className="text-xl mb-2">No playlists created yet</p>
                <p className="text-sm">Select tracks and create a playlist to see it here</p>
                <button
                  onClick={() => setActiveTab('tracks')}
                  className="mt-4 btn-primary"
                >
                  Go to Tracks
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Playlist List */}
                <div>
                  <h2 className="text-xl font-bold mb-4 text-white">Your Playlists</h2>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {createdPlaylists.map((playlist) => (
                      <div
                        key={playlist.playlist_id}
                        onClick={() => setSelectedPlaylist(playlist)}
                        className={`p-4 rounded-lg cursor-pointer transition-all border ${
                          selectedPlaylist?.playlist_id === playlist.playlist_id
                            ? 'bg-gradient-to-r from-[#1DB954]/30 to-[#1B2838]/30 border-[#1DB954]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{playlist.playlist_name}</h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {playlist.total_tracks || 0} tracks • {playlist.total_duration_minutes?.toFixed(1) || 0} min
                            </p>
                            {playlist.is_temporary && (
                              <span className="inline-block mt-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs">
                                ⚠️ Temporary
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlaylist(playlist.playlist_id);
                            }}
                            className="text-red-400 hover:text-red-300 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Playlist Details */}
                <div>
                  {selectedPlaylist ? (
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-white">{selectedPlaylist.playlist_name}</h2>
                          <p className="text-gray-400 mt-1">
                            {selectedPlaylist.total_tracks || 0} tracks • {selectedPlaylist.total_duration_minutes?.toFixed(1) || 0} minutes
                          </p>
                          {selectedPlaylist.is_temporary && (
                            <p className="text-xs text-yellow-400 mt-2">
                              ⚠️ This playlist is temporary and will be lost on page refresh
                            </p>
                          )}
                        </div>
                        {!isAuthenticated && selectedPlaylist.is_temporary && (
                          <button
                            onClick={() => navigate('/login', { state: { from: { pathname: `/tracks/${gameId}` } } })}
                            className="btn-primary text-sm"
                          >
                            Sign In to Save
                          </button>
                        )}
                      </div>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
                          selectedPlaylist.tracks.map((track, idx) => (
                            <div
                              key={track.track_id || idx}
                              className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                            >
                              <h3 className="font-semibold text-white">{track.name || 'Unknown Track'}</h3>
                              <p className="text-sm text-gray-400">{track.artists || 'Unknown Artist'}</p>
                              {track.duration && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {Math.floor(track.duration / 60)}:{(track.duration % 60).toFixed(0).padStart(2, '0')}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-center py-8">No tracks in this playlist</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[400px] text-gray-400">
                      <p>Select a playlist to view details</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Track Detail Modal */}
      {selectedTrackDetail && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTrackDetail(null)}
        >
          <div
            className="glass-panel p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-white">{selectedTrackDetail.name || 'Unknown Track'}</h2>
              <button
                onClick={() => setSelectedTrackDetail(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-label mb-1">Artists</h3>
                <p className="text-white">{selectedTrackDetail.artists || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-label mb-1">Genres</h3>
                <p className="text-white">{selectedTrackDetail.genres || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-label mb-1">Duration</h3>
                  <p className="text-white">
                    {Math.floor((selectedTrackDetail.duration || selectedTrackDetail.duration_s || 0) / 60)}:
                    {String((selectedTrackDetail.duration || selectedTrackDetail.duration_s || 0) % 60).padStart(2, '0')}
                  </p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Tempo</h3>
                  <p className="text-white">{selectedTrackDetail.tempo?.toFixed(1) || 'N/A'} BPM</p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Energy</h3>
                  <p className="text-white">{selectedTrackDetail.energy?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Valence</h3>
                  <p className="text-white">{selectedTrackDetail.valence?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Danceability</h3>
                  <p className="text-white">{selectedTrackDetail.danceability?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Popularity</h3>
                  <p className="text-white">{selectedTrackDetail.popularity || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Acousticness</h3>
                  <p className="text-white">{selectedTrackDetail.acousticness?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Instrumentalness</h3>
                  <p className="text-white">{selectedTrackDetail.instrumentalness?.toFixed(2) || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameTracks;

