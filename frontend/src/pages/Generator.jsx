import React, { useState } from 'react';

const Generator = () => {
  const [gameId, setGameId] = useState('');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    // Simulate API delay for effect
    setTimeout(() => {
        // MOCK DATA for design purposes - connect your real API here
        setPlaylist([
            { name: "Cybervoid", artist: "Stellar", duration_s: 24000 },
            { name: "Nightcall", artist: "Kavinsky", duration_s: 21000 },
            { name: "Resonance", artist: "Home", duration_s: 19500 },
        ]);
        setLoading(false);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-full">
      
      {/* Left Column: Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">Setup Session</h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">Configure your parameters to generate a synchronized audio stream.</p>
        </div>

        <div className="glass-panel p-6 md:p-8 space-y-8">
          {/* Game Input */}
          <div className="space-y-3">
            <label className="text-label block mb-2">Source Material</label>
            <input 
              type="text" 
              placeholder="Enter Steam Game ID..."
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 focus:border-blue-500 transition-all placeholder-gray-500 text-sm md:text-base"
            />
          </div>

          {/* Duration Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-label">Duration</label>
              <span className="font-mono text-xl font-medium text-white">{duration} <span className="text-sm text-gray-500">min</span></span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="240" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)}
            />
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>Quick</span>
              <span>Marathon</span>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleGenerate} 
            disabled={loading}
            className="w-full btn-primary flex justify-center items-center gap-2"
          >
            {loading ? (
               // Simple Spinner
               <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/>
            ) : (
                "Generate Mix"
            )}
          </button>
        </div>
      </div>

      {/* Right Column: Results */}
      <div className="lg:col-span-8">
        <div className="glass-panel h-full min-h-[500px] md:min-h-[600px] flex flex-col overflow-hidden relative">
            {/* Header - Spotify Style */}
            <div className="p-5 md:p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-[#1DB954]/10 via-transparent to-[#66C0F4]/10 backdrop-blur-sm">
                <span className="text-sm md:text-base font-black text-white uppercase tracking-wider">Queue</span>
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-sm shadow-red-500/50"/>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-sm shadow-yellow-500/50"/>
                    <div className="w-3 h-3 rounded-full bg-[#1DB954]/80 shadow-sm shadow-[#1DB954]/50"/>
                </div>
            </div>

            {/* Empty State - Spotify Style */}
            {!playlist && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-10 md:p-16 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#1DB954]/30 via-[#66C0F4]/30 to-purple-600/30 rounded-2xl flex items-center justify-center mb-6 border border-[#1DB954]/30 shadow-lg shadow-[#1DB954]/20">
                        <svg className="w-10 h-10 opacity-90 text-[#1DB954]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                    </div>
                    <p className="text-xl md:text-2xl font-black text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-[#1DB954]">Ready to Synchronize</p>
                    <p className="max-w-md text-gray-400 leading-relaxed">Select a game and duration to generate a curated playlist tailored to the game's pacing.</p>
                </div>
            )}
            
            {/* Loading State - Spotify Style */}
            {loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-10 md:p-16 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#1DB954]/30 via-[#66C0F4]/30 to-purple-600/30 rounded-2xl flex items-center justify-center mb-6 border border-[#1DB954]/30 shadow-lg shadow-[#1DB954]/20">
                        <div className="w-10 h-10 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin"/>
                    </div>
                    <p className="text-xl md:text-2xl font-black text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#1DB954] to-[#66C0F4]">Generating Playlist</p>
                    <p className="max-w-md text-gray-400 leading-relaxed">Analyzing game data and curating your perfect soundtrack...</p>
                </div>
            )}

            {/* List State - Spotify Style */}
            {playlist && (
                <div className="overflow-y-auto p-4 md:p-6 space-y-2">
                    {playlist.map((track, i) => (
                        <div key={i} className="group flex items-center gap-4 p-4 rounded-xl hover:bg-white/10 transition-all duration-200 cursor-default border border-transparent hover:border-[#1DB954]/30 hover:shadow-lg hover:shadow-[#1DB954]/10 relative overflow-hidden">
                            {/* Spotify-style gradient background on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/0 to-[#66C0F4]/0 group-hover:from-[#1DB954]/5 group-hover:to-[#66C0F4]/5 transition-all duration-300"></div>
                            
                            {/* Album Art - Spotify style */}
                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#1DB954]/30 via-[#66C0F4]/30 to-purple-600/30 border border-white/20 group-hover:border-[#1DB954]/50 flex items-center justify-center text-lg text-white font-black shadow-lg group-hover:shadow-[#1DB954]/30 transition-all relative z-10">
                                {track.name.slice(0,1)}
                            </div>
                            
                            <div className="flex-1 min-w-0 relative z-10">
                                <h4 className="text-white font-bold truncate text-base mb-0.5 group-hover:text-[#1DB954] transition-colors">{track.name}</h4>
                                <p className="text-gray-400 text-sm truncate group-hover:text-gray-300 transition-colors">{track.artist}</p>
                            </div>
                            
                            <div className="text-gray-500 text-sm font-mono group-hover:text-[#66C0F4] transition-colors hidden sm:block relative z-10">
                                {new Date(track.duration_ms).toISOString().slice(14, 19)}
                            </div>
                            
                            {/* Spotify-style play button */}
                            <button className="opacity-0 group-hover:opacity-100 p-3 text-black bg-[#1DB954] hover:bg-[#1ed760] rounded-full shadow-lg shadow-[#1DB954]/40 transition-all transform hover:scale-110 active:scale-95 relative z-10">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Generator;