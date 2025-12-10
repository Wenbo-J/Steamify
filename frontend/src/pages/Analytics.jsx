import React, { useState, useEffect } from 'react';
import { getGenreAudioProfile, getTopAudioGenres, getSimilarUserPlaylist } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Analytics = () => {
  const [audioProfile, setAudioProfile] = useState([]);
  const [topGenres, setTopGenres] = useState([]);
  const [similarTracks, setSimilarTracks] = useState([]);
  const [loading, setLoading] = useState({ profile: false, genres: false, similar: false });
  const { user } = useAuth();
  const userId = user?.user_id;

  useEffect(() => {
    loadAudioProfile();
    loadTopGenres();
    loadSimilarTracks();
  }, [userId]); // Reload similar tracks when userId changes

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
      // Only load similar tracks if user is authenticated
      if (userId) {
        const data = await getSimilarUserPlaylist(userId);
        setSimilarTracks(Array.isArray(data) ? data : []);
      } else {
        setSimilarTracks([]);
      }
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
          Analytics Dashboard
        </h1>
        <p className="text-gray-300">Data insights and recommendations based on game-music relationships</p>
      </div>

      {/* Genre Audio Profile */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Genre Audio Profile</h2>
            <p className="text-sm text-gray-400 mt-1">Average audio features by game genre (min. 50 tracks)</p>
          </div>
          {loading.profile && (
            <div className="w-6 h-6 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        {loading.profile ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : audioProfile.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-2">No data available</p>
            <p className="text-sm text-gray-500">Try refreshing the page</p>
          </div>
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
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white font-semibold">{genre.game_genre || 'Unknown'}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.num_tracks?.toLocaleString() || 0}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.avg_tempo ? Math.round(genre.avg_tempo) : 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.avg_energy ? genre.avg_energy.toFixed(2) : 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.avg_valence ? genre.avg_valence.toFixed(2) : 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.avg_danceability ? genre.avg_danceability.toFixed(2) : 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.avg_acousticness ? genre.avg_acousticness.toFixed(2) : 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-300">{genre.avg_popularity ? Math.round(genre.avg_popularity) : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Spotify Genres by Game Genre */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Top Spotify Genres by Game Genre</h2>
            <p className="text-sm text-gray-400 mt-1">Top 3 matching Spotify genres for each Steam game genre</p>
          </div>
          {loading.genres && (
            <div className="w-6 h-6 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        {loading.genres ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : topGenres.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-2">No data available</p>
            <p className="text-sm text-gray-500">Try refreshing the page</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(
              topGenres.reduce((acc, item) => {
                if (!acc[item.game_genre]) acc[item.game_genre] = [];
                acc[item.game_genre].push(item);
                return acc;
              }, {})
            ).map(([gameGenre, genres]) => (
              <div key={gameGenre} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-[#1DB954]/30 transition-all">
                <h3 className="font-bold text-white mb-3 text-lg">{gameGenre}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {genres.map((genre, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-[#1DB954]/10 to-[#1B2838]/10 rounded-lg p-3 border border-[#1DB954]/20 hover:border-[#1DB954]/40 transition-all">
                      <p className="text-[#1DB954] font-semibold text-sm mb-1">{genre.spotify_genre || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{genre.num_tracks?.toLocaleString() || 0} tracks</p>
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Recommended by Similar Users</h2>
            <p className="text-sm text-gray-400 mt-1">Tracks recommended by users who share at least 2 playlists with you</p>
          </div>
          {loading.similar && (
            <div className="w-6 h-6 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        {!userId ? (
          <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
            <p className="text-gray-400 mb-2">Sign in to see personalized recommendations</p>
            <p className="text-sm text-gray-500">This feature requires authentication to find users with similar playlists</p>
          </div>
        ) : loading.similar ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading recommendations...</p>
          </div>
        ) : similarTracks.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
            <p className="text-gray-400 mb-2">No recommendations available</p>
            <p className="text-sm text-gray-500">Create and save playlists to get personalized recommendations</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {similarTracks.map((track, idx) => (
              <div key={track.track_id || idx} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:border-[#1DB954]/30 transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{track.name || 'Unknown Track'}</h3>
                    <p className="text-sm text-gray-400">{track.artists || 'Unknown Artist'}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="px-2 py-1 bg-white/5 rounded">Energy: {track.energy ? track.energy.toFixed(2) : 'N/A'}</span>
                    <span className="px-2 py-1 bg-white/5 rounded">Valence: {track.valence ? track.valence.toFixed(2) : 'N/A'}</span>
                    <span className="px-2 py-1 bg-white/5 rounded">Popularity: {track.popularity || 'N/A'}</span>
                    <span className="px-3 py-1 bg-[#1DB954]/20 text-[#1DB954] rounded font-semibold">
                      {track.num_similar_users || 0} similar users
                    </span>
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

