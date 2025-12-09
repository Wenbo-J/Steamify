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
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#1DB954] via-[#EDEDED] to-[#53C8F3] drop-shadow-2xl">
          Steamify
        </h1>
        <p className="text-[#A5A5A5] text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
          Find the perfect <span className="text-[#1DB954] font-semibold">Spotify</span> soundtrack for your <span className="text-[#53C8F3] font-semibold">Steam</span> gaming session
        </p>
      </div>

      {/* Premium Search Bar */}
      <div className="glass-panel p-8 max-w-4xl mx-auto animate-fade-in bg-gradient-to-r from-white/[0.02] to-transparent">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-[#a0a0a0] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search for a game..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gradient-to-r from-white/[0.06] to-white/[0.03] border border-white/15 rounded-2xl pl-14 pr-6 py-5 text-[#EDEDED] placeholder-[#6b6b6b] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:bg-white/[0.08] transition-all text-base font-medium backdrop-blur-sm"
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
          {filteredGames.map((game, index) => (
            <div
              key={game.game_id}
              onClick={() => handleGameSelect(game)}
              className="glass-panel p-0 group cursor-pointer hover:shadow-2xl hover:shadow-[#1DB954]/30 transition-all duration-500 hover:-translate-y-3 border border-white/10 hover:border-[#1DB954]/60 overflow-hidden relative animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Premium hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/0 via-[#1B2838]/0 to-[#2a475e]/0 group-hover:from-[#1DB954]/15 group-hover:via-[#1B2838]/15 group-hover:to-[#2a475e]/15 transition-all duration-500 pointer-events-none z-10"></div>
              
              {/* Premium Image / Header */}
              <div className="h-52 md:h-56 bg-gradient-to-br from-[#1a2332] via-[#233447] to-[#1f2838] relative overflow-hidden">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" style={{ mixBlendMode: 'overlay' }}></div>
                
                {/* Premium gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-[#1DB954]/15 to-transparent group-hover:via-[#1DB954]/25 transition-all duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#1B2838]/0 to-[#1B2838]/40 group-hover:to-[#1B2838]/50 transition-all duration-500"></div>
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {/* Premium Rating Badge */}
                {game.rating && (
                  <div className="absolute top-4 right-4 bg-gradient-to-br from-black/90 to-black/70 backdrop-blur-xl text-xs font-black px-4 py-2 rounded-xl text-white border border-[#1DB954]/40 shadow-2xl shadow-[#1DB954]/20 group-hover:border-[#1DB954] group-hover:shadow-[#1DB954]/40 group-hover:scale-105 transition-all duration-300">
                    {game.rating}%
                  </div>
                )}
              </div>

              <div className="p-6 md:p-7 relative z-20">
                <h3 className="font-black text-xl md:text-2xl leading-tight mb-3 text-[#EDEDED] group-hover:text-[#1DB954] transition-colors duration-300 line-clamp-2 min-h-[3.5rem]">
                  {game.name}
                </h3>
                <p className="text-sm text-[#A5A5A5] mb-5 line-clamp-1 group-hover:text-[#EDEDED] transition-colors duration-300 font-medium">
                  {game.genres || game.genre_list || 'Genre N/A'}
                </p>
                
                <div className="flex justify-between items-center border-t border-white/10 group-hover:border-[#1DB954]/30 pt-5 mt-3 transition-colors duration-300">
                  <span className="text-[10px] uppercase font-bold text-[#6b6b6b] group-hover:text-[#53C8F3] tracking-wider transition-colors duration-300">
                    {game.game_id}
                  </span>
                  <span className="text-sm text-[#53C8F3] font-bold group-hover:text-[#1DB954] group-hover:translate-x-2 transition-all duration-300 inline-flex items-center gap-2">
                    View Tracks <span className="text-lg">&rarr;</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Premium Stats Footer */}
      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 border-t border-white/10 pt-16 max-w-5xl mx-auto">
        <div className="text-center group">
          <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] to-white mb-3 group-hover:from-[#1ed760] transition-all duration-300">
            {games.length}
          </div>
          <div className="text-xs sm:text-sm text-[#A5A5A5] uppercase tracking-widest font-bold">Games Available</div>
        </div>
        <div className="text-center group">
          <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#53C8F3] to-[#EDEDED] mb-3 group-hover:from-[#66C0F4] transition-all duration-300">
            ∞
          </div>
          <div className="text-xs sm:text-sm text-[#A5A5A5] uppercase tracking-widest font-bold">Tracks Matched</div>
        </div>
        <div className="text-center group">
          <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] via-[#EDEDED] to-[#53C8F3] mb-3 transition-all duration-300">
            100%
          </div>
          <div className="text-xs sm:text-sm text-[#A5A5A5] uppercase tracking-widest font-bold">Immersion</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
