import React, { useState, useEffect } from 'react';
import GlitchHeader from '../components/GlitchHeader';
import GameCard from '../components/GameCard';
import { fetchGames } from '../services/api'; // We will build this next

const Browser = () => {
  const [games, setGames] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Pagination / Infinite Scroll logic could go here
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch page 1 of games
        const data = await fetchGames(page); 
        setGames(data);
      } catch (error) {
        console.error("Data Fetch Error:", error);
      }
      setLoading(false);
    };
    loadData();
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <GlitchHeader 
        title="DATABASE" 
        subtitle="INDEXED STEAM TITLES AND METADATA."
      />

      {/* Control Bar */}
      <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
        <div className="mono text-xs text-muted">
          DISPLAYING RECORDS 1 - 20
        </div>
        <div className="flex gap-4">
           <button 
             disabled={page === 1}
             onClick={() => setPage(p => Math.max(1, p - 1))}
             className="btn-primary text-xs py-2 px-4 disabled:opacity-30"
           >
             PREV_PAGE
           </button>
           <button 
             onClick={() => setPage(p => p + 1)}
             className="btn-primary text-xs py-2 px-4"
           >
             NEXT_PAGE
           </button>
        </div>
      </div>

      {loading ? (
        <div className="mono text-center text-accent animate-pulse mt-20">
          FETCHING DATA PACKETS...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.game_id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Browser;