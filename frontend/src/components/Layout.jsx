import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  
  const NavLink = ({ to, label }) => {
    const active = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
          active 
          ? 'bg-gradient-to-r from-[#1DB954] to-[#66C0F4] text-black shadow-lg shadow-[#1DB954]/30' 
          : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-black overflow-x-hidden">
      {/* Background Ambience - Spotify & Steam Inspired */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#1DB954] rounded-full blur-[140px] opacity-15 pointer-events-none z-0 animate-pulse" style={{animationDuration: '8s'}} />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#66C0F4] rounded-full blur-[120px] opacity-18 pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-purple-600 rounded-full blur-[100px] opacity-10 pointer-events-none z-0" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-nav h-16 flex items-center justify-between px-4 sm:px-6 md:px-12">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity group">
          {/* Logo Icon - Spotify & Steam Inspired */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1DB954] via-[#1DB954] to-[#66C0F4] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#1DB954]/40 group-hover:shadow-[#1DB954]/60 transition-shadow">
            SF
          </div>
          <span className="font-bold text-lg tracking-tight text-white group-hover:text-[#1DB954] transition-colors">Steamify</span>
        </Link>

        <div className="hidden md:flex gap-1 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-xl shadow-lg">
          <NavLink to="/" label="Home" />
          <NavLink to="/browse" label="Browse Music" />
          <NavLink to="/playlists" label="My Playlists" />
          <NavLink to="/analytics" label="Analytics" />
        </div>

        {/* Mobile menu button placeholder */}
        <div className="md:hidden w-8" />
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full pt-24 md:pt-28 px-4 sm:px-6 lg:px-8 pb-12 md:pb-16 max-w-7xl mx-auto relative z-10">
        {children}
      </main>
    </div>
  );
};

export default Layout;