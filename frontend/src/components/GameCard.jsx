import React from 'react';

const GameCard = ({ game }) => {
  return (
    <div className="glass-panel p-0 group cursor-pointer hover:shadow-2xl hover:shadow-[#1DB954]/30 transition-all duration-300 hover:-translate-y-2 border border-white/5 hover:border-[#1B2838]/50 overflow-hidden relative">
      {/* Steam-style hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/0 via-[#1B2838]/0 to-[#2a475e]/0 group-hover:from-[#1DB954]/10 group-hover:via-[#1B2838]/10 group-hover:to-[#2a475e]/10 transition-all duration-300 pointer-events-none z-10"></div>
      
      {/* Image / Header Placeholder - Spotify + Steam gradient overlay */}
      <div className="h-44 md:h-48 bg-gradient-to-br from-gray-800 via-[#1B2838] to-black relative overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        {/* Spotify-style gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-[#1DB954]/20 to-transparent group-hover:via-[#1DB954]/30 transition-all duration-300"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B2838]/0 to-[#1B2838]/30 group-hover:to-[#1B2838]/40 transition-all duration-300"></div>
        
        {/* Steam-style Badge */}
        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md text-xs font-black px-3 py-1.5 rounded-lg text-white border border-[#1DB954]/40 shadow-lg shadow-[#1DB954]/20 group-hover:border-[#1DB954] group-hover:shadow-[#1DB954]/40 transition-all">
            {game.rating ? `${game.rating}%` : 'NR'}
        </div>
      </div>

      <div className="p-5 md:p-6 relative z-20">
        <h3 className="font-black text-lg md:text-xl leading-tight mb-2 text-white group-hover:text-[#1DB954] transition-colors line-clamp-2 min-h-[3rem]">
            {game.name}
        </h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-1 group-hover:text-gray-300 transition-colors">{game.genres || 'Genre N/A'}</p>
        
        <div className="flex justify-between items-center border-t border-white/10 group-hover:border-[#1B2838]/50 pt-4 mt-2 transition-colors">
            <span className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-[#1B2838] tracking-wider transition-colors">ID: {game.game_id}</span>
            <span className="text-xs text-[#1B2838] font-bold group-hover:text-[#1DB954] group-hover:translate-x-1 transition-all inline-flex items-center gap-1">
              Details <span className="text-base">&rarr;</span>
            </span>
        </div>
      </div>
    </div>
  );
};

export default GameCard;