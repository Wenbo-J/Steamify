import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAuthenticated } = useAuth();
  
  const NavLink = ({ to, label }) => {
    const active = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
          active 
          ? 'bg-gradient-to-r from-[#1DB954] to-[#53C8F3] text-black shadow-xl shadow-[#1DB954]/40' 
          : 'text-[#A5A5A5] hover:text-[#EDEDED] hover:bg-white/5'
        }`}
      >
        {active && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent opacity-50" />
        )}
        <span className="relative z-10">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-gradient-to-b from-[#1a2332] via-[#233447] to-[#1B2838] overflow-x-hidden">
      {/* Premium Background Ambience - Lightened & Refined */}
      <div className="fixed top-[-15%] left-[-5%] w-[70%] h-[70%] bg-[#1DB954] rounded-full blur-[180px] opacity-[0.08] pointer-events-none z-0 animate-pulse" style={{animationDuration: '12s'}} />
      <div className="fixed bottom-[-5%] right-[-5%] w-[60%] h-[60%] bg-[#53C8F3] rounded-full blur-[160px] opacity-[0.08] pointer-events-none z-0" />
      
      {/* Subtle light overlay for brightness */}
      <div className="fixed inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent pointer-events-none z-0" />
      
      {/* Subtle grid overlay - very minimal */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0 opacity-25" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-nav h-20 flex items-center justify-between px-6 sm:px-8 md:px-16">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-all duration-300 group">
          {/* Logo Icon - Spotify green to Cyan gradient */}
          <img
            src="/logo.png"
            alt="Steamify Logo"
            className="relative w-10 h-10 rounded-xl shadow-xl shadow-[#1DB954]/30 group-hover:shadow-[#1DB954]/50 transition-all duration-300 group-hover:scale-105 object-contain bg-gradient-to-br from-[#1DB954] via-[#1DB954] to-[#53C8F3]"
          />
          <span className="font-black text-xl tracking-tight text-[#EDEDED] group-hover:text-[#1DB954] transition-colors duration-300">Steamify</span>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <div className="flex gap-2 bg-gradient-to-r from-white/[0.03] to-white/[0.01] p-1.5 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl">
          <NavLink to="/" label="Home" />
            <NavLink to="/browse" label="Browse Music" />
            <NavLink to="/analytics" label="Analytics" />
            {isAuthenticated && (
              <NavLink to="/playlists" label="My Playlists" />
            )}
          </div>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name || user.email} 
                  className="w-10 h-10 rounded-full border-2 border-[#1DB954]/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1DB954] to-[#53C8F3] flex items-center justify-center text-white font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#EDEDED]">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </span>
                <button
                  onClick={signOut}
                  className="text-xs text-[#A5A5A5] hover:text-[#EDEDED] transition-colors text-left"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary text-sm px-4 py-2"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile menu button placeholder */}
        <div className="md:hidden w-8" />
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full pt-28 md:pt-32 px-4 sm:px-6 lg:px-12 pb-16 md:pb-20 max-w-7xl mx-auto relative z-10">
        {children}
      </main>
    </div>
  );
};

export default Layout;