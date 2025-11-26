import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'text-accent border-b border-accent' : 'text-muted hover:text-white';

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* HUD Navigation */}
      <nav className="fixed top-0 w-full z-50 px-10 py-6 flex justify-between items-center mix-blend-difference">
        <div className="mono font-bold tracking-widest text-lg select-none">
          AUDIO<span className="text-accent">SYNC</span> // SYSTEM
        </div>

        <div className="flex gap-8 mono text-xs tracking-widest">
          <Link to="/" className={`pb-1 transition ${isActive('/')}`}>[ ROOT ]</Link>
          <Link to="/generator" className={`pb-1 transition ${isActive('/generator')}`}>[ GENERATOR ]</Link>
          <Link to="/browser" className={`pb-1 transition ${isActive('/browser')}`}>[ DB_BROWSER ]</Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow pt-24 px-4 relative z-10">
        {children}
      </main>

      {/* Decorative Footer */}
      <footer className="fixed bottom-6 right-10 mono text-[10px] text-gray-700 select-none">
        SYS.VER.2.0.4 // UPENN_CIS5500 // GROUP_11
      </footer>
    </div>
  );
};

export default Layout;