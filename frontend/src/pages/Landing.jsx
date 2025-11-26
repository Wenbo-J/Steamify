import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full text-center px-4 relative">
      {/* Decorative gradient orbs - Spotify & Steam inspired */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#1DB954] rounded-full blur-[200px] opacity-20 pointer-events-none z-0 animate-pulse" style={{animationDuration: '6s'}} />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#66C0F4] rounded-full blur-[150px] opacity-15 pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600 rounded-full blur-[120px] opacity-12 pointer-events-none z-0" />

      <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-[#1DB954] to-[#66C0F4] relative z-10 drop-shadow-2xl">
        AudioSync.
      </h1>
      
      <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-2xl mb-12 leading-relaxed font-normal relative z-10 px-4">
        Adaptive audio environments for modern gaming. <br className="hidden sm:block"/>
        Bridge the gap between <span className="text-[#1DB954] font-semibold">gameplay</span> and <span className="text-[#66C0F4] font-semibold">soundtrack</span>.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 z-10 mb-20">
        <Link to="/generator">
          <button className="btn-primary w-full sm:w-auto min-w-[200px]">
            Launch Generator
          </button>
        </Link>
        <Link to="/browser">
          <button className="btn-secondary w-full sm:w-auto min-w-[200px]">
            Browse Library
          </button>
        </Link>
      </div>
      
      {/* Footer Stats - Enhanced */}
      <div className="mt-8 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 border-t border-white/20 pt-12 w-full max-w-4xl">
        <div className="text-center sm:text-left group">
            <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] to-white mb-2 group-hover:from-[#1ed760] transition-all">20k+</div>
            <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-bold">Games Indexed</div>
        </div>
        <div className="text-center sm:text-left group">
            <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#66C0F4] to-white mb-2 group-hover:from-[#7dcff5] transition-all">50ms</div>
            <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-bold">Latency</div>
        </div>
        <div className="text-center sm:text-left group">
            <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white mb-2 group-hover:from-purple-300 transition-all">100%</div>
            <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-bold">Immersion</div>
        </div>
      </div>
    </div>
  );
};

export default Landing;