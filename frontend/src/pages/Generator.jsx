import React, { useState } from 'react';

const Generator = () => {
  const [gameId, setGameId] = useState(''); // You might want a search dropdown here eventually
  const [duration, setDuration] = useState(60); // Default 60 mins
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState(null);

  // Simulating the API call from Milestone 4
  const handleGenerate = async () => {
    setLoading(true);
    try {
      // NOTE: Replace with your actual backend URL
      // This matches your Milestone 4 spec: GET /recommendations?game_id=X&session_minutes=Y
      const response = await fetch(`http://localhost:8080/recommendations?game_id=${gameId}&session_minutes=${duration}`);
      const data = await response.json();
      setPlaylist(data); 
    } catch (err) {
      console.error("System Failure:", err);
    }
    setLoading(false);
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <header className="mb-16 border-b border-gray-800 pb-8">
        <h2 className="text-4xl font-bold mb-2">SESSION CONFIGURATION</h2>
        <p className="mono text-muted text-sm">SELECT INPUT PARAMETERS FOR AUDIO SYNTHESIS</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* LEFT: CONTROLS */}
        <div className="space-y-8">
          
          <div className="group">
            <label className="mono block text-accent mb-2 text-xs">TARGET_GAME_ID (STEAM)</label>
            <input 
              type="text" 
              className="w-full bg-transparent border-b border-gray-700 text-3xl py-2 focus:outline-none focus:border-accent transition text-white"
              placeholder="ENTER ID..."
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            />
          </div>

          <div className="group">
            <label className="mono block text-accent mb-2 text-xs">SESSION_DURATION: {duration} MIN</label>
            <input 
              type="range" 
              min="10" 
              max="240" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)}
              className="w-full h-1 bg-gray-800 appearance-none cursor-pointer"
            />
            <div className="flex justify-between mono text-xs text-gray-600 mt-2">
              <span>SHORT</span>
              <span>MARATHON</span>
            </div>
          </div>

          <button onClick={handleGenerate} className="btn-primary w-full mt-8">
            {loading ? "PROCESSING..." : "EXECUTE QUERY"}
          </button>
        </div>

        {/* RIGHT: OUTPUT TERMINAL */}
        <div className="glass-panel p-6 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
             <span className="mono text-xs text-muted">OUTPUT_LOG</span>
             <span className="mono text-xs text-accent animate-pulse">
               {playlist ? 'STATUS: ACTIVE' : 'STATUS: IDLE'}
             </span>
          </div>

          {!playlist && (
            <div className="flex-1 flex items-center justify-center text-gray-800 mono text-sm">
              WAITING FOR INPUT...
            </div>
          )}

          {playlist && (
            <div className="space-y-2 overflow-y-auto h-[400px] pr-2">
              {playlist.map((track, i) => (
                <div key={i} className="flex justify-between items-center hover:bg-white/5 p-2 rounded transition cursor-default group">
                  <div className="flex items-center gap-4">
                    <span className="mono text-xs text-gray-600">{(i + 1).toString().padStart(2, '0')}</span>
                    <div>
                      <div className="font-bold text-sm group-hover:text-accent transition">{track.name}</div>
                      <div className="text-xs text-gray-500">{track.artist}</div>
                    </div>
                  </div>
                  <div className="mono text-xs text-gray-600">
                    {new Date(track.duration_s * 1000).toISOString().slice(14, 19)}
                  </div>
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