import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getGameRecommendations, createPlaylist, getTrack } from '../services/api';

const GameTracks = () => {
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (gameId) {
      handleGenerate();
    }
  }, [gameId]);

  const handleGenerate = async () => {
    if (!gameId) return;
    setLoading(true);
    try {
      const data = await getGameRecommendations(
        gameId,
        filters.sessionMinutes,
        filters.minEnergy,
        filters.maxEnergy,
        filters.minValence,
        filters.maxValence
      );
      setRecommendations(Array.isArray(data) ? data : []);
      setSelectedTracks(new Set());
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrackSelection = (trackId) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTracks(newSelected);
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim() || selectedTracks.size === 0) {
      alert('Please enter a playlist name and select at least one track');
      return;
    }
    setCreatingPlaylist(true);
    try {
      const trackIds = Array.from(selectedTracks);
      const result = await createPlaylist(playlistName, trackIds);
      if (result.playlist_id) {
        alert('Playlist created successfully!');
        setPlaylistName('');
        setSelectedTracks(new Set());
      }
    } catch (err) {
      console.error('Failed to create playlist:', err);
      alert('Failed to create playlist');
    } finally {
      setCreatingPlaylist(false);
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

        {/* Right: Tracks */}
        <div className="lg:col-span-3">
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
                      </div>
                      <button
                        onClick={handleCreatePlaylist}
                        disabled={creatingPlaylist || !playlistName.trim()}
                        className="btn-primary"
                      >
                        {creatingPlaylist ? 'Creating...' : `Create (${selectedTracks.size})`}
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
                              Energy: {track.energy} | Valence: {track.valence} | Fit: {track.fit_score?.toFixed(1)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 font-mono">
                            {Math.floor((track.track_duration_s || 0) / 60)}:{(track.track_duration_s || 0) % 60}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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

