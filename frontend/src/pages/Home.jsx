import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllGames } from '../services/api';

const Home = () => {
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      try {
        const data = await getAllGames();
        setGames(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load games:', err);
        setGames([]);
      } finally {
        setLoading(false);
      }
    };
    loadGames();
  }, []);

  const filteredGames = games.filter(game =>
    game.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGameSelect = (game) => {
    // Navigate to tracks page with game ID
    navigate(`/tracks/${game.game_id}`, { state: { game } });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#1DB954] via-white to-[#1B2838] drop-shadow-2xl">
          Steamify
        </h1>
        <p className="text-gray-300 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
          Find the perfect <span className="text-[#1DB954] font-semibold">Spotify</span> soundtrack for your <span className="text-[#1B2838] font-semibold">Steam</span> gaming session
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search for a game..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:bg-white/10 transition-all text-lg"
            />
          </div>
        </div>
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-64 bg-white/5 rounded-xl border border-white/10 animate-pulse"></div>
          ))}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-xl mb-2">No games found</p>
          <p className="text-gray-500 text-sm">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <div
              key={game.game_id}
              onClick={() => handleGameSelect(game)}
              className="glass-panel p-0 group cursor-pointer hover:shadow-2xl hover:shadow-[#1DB954]/20 transition-all duration-300 hover:-translate-y-2 border border-white/10 hover:border-[#1DB954]/50 overflow-hidden relative"
            >
              {/* Steam-style hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/0 via-[#1B2838]/0 to-[#2a475e]/0 group-hover:from-[#1DB954]/10 group-hover:via-[#1B2838]/10 group-hover:to-[#2a475e]/10 transition-all duration-300 pointer-events-none z-10"></div>
              
              {/* Image / Header Placeholder */}
              <div className="h-44 md:h-48 bg-gradient-to-br from-gray-800 via-[#1B2838] to-black relative overflow-hidden">
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                
                {/* Spotify + Steam gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-[#1DB954]/20 to-transparent group-hover:via-[#1DB954]/30 transition-all duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#1B2838]/0 to-[#1B2838]/30 group-hover:to-[#1B2838]/40 transition-all duration-300"></div>
                
                {/* Rating Badge */}
                {game.rating && (
                  <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md text-xs font-black px-3 py-1.5 rounded-lg text-white border border-[#1DB954]/40 shadow-lg shadow-[#1DB954]/20 group-hover:border-[#1DB954] group-hover:shadow-[#1DB954]/40 transition-all">
                    {game.rating}%
                  </div>
                )}
              </div>

              <div className="p-5 md:p-6 relative z-20">
                <h3 className="font-black text-lg md:text-xl leading-tight mb-2 text-white group-hover:text-[#1DB954] transition-colors line-clamp-2 min-h-[3rem]">
                  {game.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-1 group-hover:text-gray-300 transition-colors">
                  {game.genres || game.genre_list || 'Genre N/A'}
                </p>
                
                <div className="flex justify-between items-center border-t border-white/10 group-hover:border-[#1B2838]/50 pt-4 mt-2 transition-colors">
                  <span className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-[#1B2838] tracking-wider transition-colors">
                    {game.game_id}
                  </span>
                  <span className="text-xs text-[#1B2838] font-bold group-hover:text-[#1DB954] group-hover:translate-x-1 transition-all inline-flex items-center gap-1">
                    View Tracks <span className="text-base">&rarr;</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 border-t border-white/20 pt-12 max-w-4xl mx-auto">
        <div className="text-center group">
          <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] to-white mb-2 group-hover:from-[#1ed760] transition-all">
            {games.length}
          </div>
          <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-bold">Games Available</div>
        </div>
        <div className="text-center group">
          <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1B2838] to-white mb-2 group-hover:from-[#2a475e] transition-all">
            ∞
          </div>
          <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-bold">Tracks Matched</div>
        </div>
        <div className="text-center group">
          <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] via-white to-[#1B2838] mb-2 transition-all">
            100%
          </div>
          <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-bold">Immersion</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
