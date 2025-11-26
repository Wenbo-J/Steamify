import React, { useState, useEffect } from 'react';
import GameCard from '../components/GameCard';
import { fetchGames } from '../services/api';

const Browser = () => {
  const [games, setGames] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchGames(page);
        setGames(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    loadData();
  }, [page]);

  return (
    <div className="pb-12 md:pb-20">
      <div className="mb-8 md:mb-12 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-[#1DB954] to-[#66C0F4]">
          Library
        </h1>
        <p className="text-gray-300 max-w-2xl text-base md:text-lg leading-relaxed">
          Browse the indexed Steam catalog. Select a title to view synchronization details.
        </p>
      </div>

      {/* Filter / Pagination Bar - Steam Style */}
      <div className="glass-panel px-4 md:px-6 py-3.5 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-20 z-40 backdrop-blur-xl border-[#66C0F4]/20">
        <div className="text-sm md:text-base text-gray-300 font-semibold">
            Page <span className="text-[#1DB954] font-black">{page}</span>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-[#66C0F4]/20 text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-[#66C0F4]/40 text-gray-300 hover:text-white"
            >
                Previous
            </button>
            <button 
                onClick={() => setPage(p => p + 1)}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#1DB954] to-[#1ed760] text-black hover:from-[#1ed760] hover:to-[#1DB954] text-sm font-black transition-all shadow-lg shadow-[#1DB954]/30 hover:shadow-[#1DB954]/50"
            >
                Next
            </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 animate-pulse">
            {[1,2,3,4,5,6,7,8].map(n => (
                <div key={n} className="h-72 bg-white/5 rounded-[18px] border border-white/5"></div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {games.map((game) => (
            <GameCard key={game.game_id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Browser;