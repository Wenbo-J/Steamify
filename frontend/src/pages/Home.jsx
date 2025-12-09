import React, { useState, useEffect } from 'react';
import { getAllGames, getGameRecommendations, createPlaylist } from '../services/api';

const Home = () => {
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
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

  useEffect(() => {
    const loadGames = async () => {
      try {
        const data = await getAllGames();
        setGames(data);
      } catch (err) {
        console.error('Failed to load games:', err);
      }
    };
    loadGames();
  }, []);

  const filteredGames = games.filter(game =>
    game.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!selectedGame) return;
    setLoading(true);
    try {
      const data = await getGameRecommendations(
        selectedGame.game_id,
        filters.sessionMinutes,
        filters.minEnergy,
        filters.maxEnergy,
        filters.minValence,
        filters.maxValence
      );
      setRecommendations(data);
      setSelectedTracks(new Set());
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
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

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-[#1DB954] to-[#66C0F4]">
          Steamify
        </h1>
        <p className="text-gray-300 text-lg">Find the perfect soundtrack for your gaming session</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Game Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Select Game</h2>
            <input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] mb-4"
            />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredGames.map((game) => (
                <div
                  key={game.game_id}
                  onClick={() => {
                    setSelectedGame(game);
                    setRecommendations([]);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedGame?.game_id === game.game_id
                      ? 'bg-gradient-to-r from-[#1DB954]/30 to-[#66C0F4]/30 border-2 border-[#1DB954]'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <h3 className="font-semibold text-white">{game.name}</h3>
                  <p className="text-sm text-gray-400">Rating: {game.rating || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          {selectedGame && (
            <div className="glass-panel p-6">
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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
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
                  {loading ? 'Generating...' : 'Generate Recommendations'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Recommendations */}
        <div className="lg:col-span-2">
          <div className="glass-panel p-6 min-h-[600px]">
            {!selectedGame ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="text-xl mb-2">Select a game to get started</p>
                <p className="text-sm">Choose a game from the list to generate recommendations</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Generating recommendations...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="text-xl mb-2">No recommendations yet</p>
                <p className="text-sm">Click "Generate Recommendations" to see tracks</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    Recommendations for {selectedGame.name}
                  </h2>
                  <span className="text-sm text-gray-400">{recommendations.length} tracks</span>
                </div>

                {/* Playlist Creation */}
                {selectedTracks.size > 0 && (
                  <div className="bg-white/5 border border-[#1DB954]/30 rounded-lg p-4 mb-4">
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-label block mb-2">Playlist Name</label>
                        <input
                          type="text"
                          value={playlistName}
                          onChange={(e) => setPlaylistName(e.target.value)}
                          placeholder="Enter playlist name..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                        />
                      </div>
                      <button
                        onClick={handleCreatePlaylist}
                        disabled={creatingPlaylist || !playlistName.trim()}
                        className="btn-primary"
                      >
                        {creatingPlaylist ? 'Creating...' : `Create Playlist (${selectedTracks.size})`}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {recommendations.map((track, idx) => (
                    <div
                      key={track.track_id || idx}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        selectedTracks.has(track.track_id)
                          ? 'bg-[#1DB954]/20 border-[#1DB954]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => toggleTrackSelection(track.track_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{track.track_name || track.name}</h3>
                          <p className="text-sm text-gray-400">
                            Energy: {track.energy} | Valence: {track.valence} | Fit: {track.fit_score?.toFixed(1)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">
                            {Math.floor((track.track_duration_s || 0) / 60)}:{(track.track_duration_s || 0) % 60}
                          </span>
                          {selectedTracks.has(track.track_id) && (
                            <span className="text-[#1DB954]">✓</span>
                          )}
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
    </div>
  );
};

export default Home;

