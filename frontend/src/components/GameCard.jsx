import React from 'react';

const GameCard = ({ game }) => {
  // Expecting game object from your Steam table
  return (
    <div className="glass-panel p-6 flex flex-col h-full group relative overflow-hidden">
      {/* Hover Highlight */}
      <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-start mb-4">
        <span className="mono text-[10px] text-accent border border-accent px-1 rounded">
          ID: {game.game_id}
        </span>
        <span className="mono text-[10px] text-gray-500">
          {game.release_date || 'N/A'}
        </span>
      </div>

      <h3 className="text-2xl font-bold leading-none mb-2 group-hover:text-accent transition-colors">
        {game.name}
      </h3>
      
      <div className="mt-auto space-y-2 pt-4">
        <div className="flex justify-between mono text-xs text-gray-400">
          <span>GENRE</span>
          <span className="text-white text-right">{game.genres || 'Unknown'}</span>
        </div>
        <div className="flex justify-between mono text-xs text-gray-400">
          <span>RATING</span>
          <span className="text-white">{game.rating ? `${game.rating}%` : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default GameCard;