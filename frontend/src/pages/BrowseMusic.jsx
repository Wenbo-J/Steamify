import React, { useState, useEffect } from 'react';
import { getAllTracks, getTrack } from '../services/api';

const BrowseMusic = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadTracks = async () => {
      setLoading(true);
      try {
        // Note: This endpoint needs to be implemented in backend
        // For now, we'll use a placeholder or fetch from recommendations
        const data = await getAllTracks();
        setTracks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load tracks:', err);
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };
    loadTracks();
  }, []);

  const handleTrackClick = async (trackId) => {
    try {
      const trackData = await getTrack(trackId);
      setSelectedTrack(trackData);
    } catch (err) {
      console.error('Failed to load track details:', err);
    }
  };

  const filteredTracks = tracks.filter(track =>
    track.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.artists?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
        <h1 className="text-4xl md:text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-[#1DB954] to-[#1B2838] bg-[length:400%_100%]">
          Browse Music
        </h1>
          <p className="text-gray-300">Explore all available tracks in the database</p>
        </div>
      </div>

      <div className="glass-panel p-4">
        <input
          type="text"
          placeholder="Search tracks by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-32 bg-white/5 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTracks.map((track) => (
            <div
              key={track.track_id}
              onClick={() => handleTrackClick(track.track_id)}
              className="glass-panel p-4 cursor-pointer hover:bg-white/10 transition-all hover:border-[#1DB954]/50"
            >
              <div className="w-full h-32 bg-gradient-to-br from-[#1DB954]/30 to-[#1B2838]/30 rounded-lg mb-3 flex items-center justify-center text-white font-bold text-2xl">
                {track.name?.charAt(0) || '?'}
              </div>
              <h3 className="font-semibold text-white truncate mb-1">{track.name || 'Unknown'}</h3>
              <p className="text-sm text-gray-400 truncate">{track.artists || 'Unknown Artist'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Track Detail Modal */}
      {selectedTrack && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTrack(null)}
        >
          <div
            className="glass-panel p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-white">{selectedTrack.name || 'Unknown Track'}</h2>
              <button
                onClick={() => setSelectedTrack(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-label mb-1">Artists</h3>
                <p className="text-white">{selectedTrack.artists || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-label mb-1">Genres</h3>
                <p className="text-white">{selectedTrack.genres || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-label mb-1">Duration</h3>
                  <p className="text-white">
                    {Math.floor((selectedTrack.duration || selectedTrack.duration_s || 0) / 60)}:
                    {String((selectedTrack.duration || selectedTrack.duration_s || 0) % 60).padStart(2, '0')}
                  </p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Tempo</h3>
                  <p className="text-white">{selectedTrack.tempo?.toFixed(1) || 'N/A'} BPM</p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Energy</h3>
                  <p className="text-white">{selectedTrack.energy?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Valence</h3>
                  <p className="text-white">{selectedTrack.valence?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Danceability</h3>
                  <p className="text-white">{selectedTrack.danceability?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Popularity</h3>
                  <p className="text-white">{selectedTrack.popularity || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Acousticness</h3>
                  <p className="text-white">{selectedTrack.acousticness?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-label mb-1">Instrumentalness</h3>
                  <p className="text-white">{selectedTrack.instrumentalness?.toFixed(2) || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseMusic;

