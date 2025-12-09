import React, { useState, useEffect } from 'react';
import { getGenreAudioProfile, getTopAudioGenres, getSimilarUserPlaylist } from '../services/api';

const Analytics = () => {
  const [audioProfile, setAudioProfile] = useState([]);
  const [topGenres, setTopGenres] = useState([]);
  const [similarTracks, setSimilarTracks] = useState([]);
  const [loading, setLoading] = useState({ profile: false, genres: false, similar: false });
  const [userId] = useState('test-user-id'); // In real app, get from auth context

  useEffect(() => {
    loadAudioProfile();
    loadTopGenres();
    loadSimilarTracks();
  }, []);

  const loadAudioProfile = async () => {
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      const data = await getGenreAudioProfile();
      setAudioProfile(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load audio profile:', err);
      setAudioProfile([]);
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const loadTopGenres = async () => {
    setLoading(prev => ({ ...prev, genres: true }));
    try {
      const data = await getTopAudioGenres();
      setTopGenres(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load top genres:', err);
      setTopGenres([]);
    } finally {
      setLoading(prev => ({ ...prev, genres: false }));
    }
  };

  const loadSimilarTracks = async () => {
    setLoading(prev => ({ ...prev, similar: true }));
    try {
      const data = await getSimilarUserPlaylist(userId);
      setSimilarTracks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load similar tracks:', err);
      setSimilarTracks([]);
    } finally {
      setLoading(prev => ({ ...prev, similar: false }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-[#1DB954] to-[#1B2838]">
            Analytics
          </h1>
        <p className="text-gray-300">Data insights and recommendations</p>
      </div>

      {/* Genre Audio Profile */}
      <div className="glass-panel p-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Genre Audio Profile</h2>
        {loading.profile ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : audioProfile.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-label">Game Genre</th>
                  <th className="text-left py-3 px-4 text-label">Tracks</th>
                  <th className="text-left py-3 px-4 text-label">Avg Tempo</th>
                  <th className="text-left py-3 px-4 text-label">Avg Energy</th>
                  <th className="text-left py-3 px-4 text-label">Avg Valence</th>
                  <th className="text-left py-3 px-4 text-label">Avg Danceability</th>
                  <th className="text-left py-3 px-4 text-label">Avg Acousticness</th>
                  <th className="text-left py-3 px-4 text-label">Avg Popularity</th>
                </tr>
              </thead>
              <tbody>
                {audioProfile.map((genre, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white font-semibold">{genre.game_genre}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.num_tracks}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.avg_tempo?.toFixed(1)}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.avg_energy?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.avg_valence?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.avg_danceability?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.avg_acousticness?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.avg_popularity?.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Spotify Genres by Game Genre */}
      <div className="glass-panel p-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Top Spotify Genres by Game Genre</h2>
        {loading.genres ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : topGenres.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No data available</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(
              topGenres.reduce((acc, item) => {
                if (!acc[item.game_genre]) acc[item.game_genre] = [];
                acc[item.game_genre].push(item);
                return acc;
              }, {})
            ).map(([gameGenre, genres]) => (
              <div key={gameGenre} className="bg-white/5 rounded-lg p-4">
                <h3 className="font-bold text-white mb-3">{gameGenre}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {genres.map((genre, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-[#1DB954] font-semibold">{genre.spotify_genre}</p>
                      <p className="text-sm text-gray-400">{genre.num_tracks} tracks</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Similar User Recommendations */}
      <div className="glass-panel p-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Recommended by Similar Users</h2>
        {loading.similar ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : similarTracks.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No recommendations available</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {similarTracks.map((track, idx) => (
              <div key={track.track_id || idx} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{track.name || 'Unknown Track'}</h3>
                    <p className="text-sm text-gray-400">{track.artists || 'Unknown Artist'}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <span>Energy: {track.energy}</span>
                    <span>Valence: {track.valence}</span>
                    <span>Popularity: {track.popularity}</span>
                    <span className="text-[#1DB954]">{track.num_similar_users} similar users</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;

