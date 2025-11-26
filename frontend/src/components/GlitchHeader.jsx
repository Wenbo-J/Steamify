import React from 'react';

const GlitchHeader = ({ title, subtitle }) => {
  return (
    <div className="mb-12 relative group cursor-default">
      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white relative z-10">
        {title}
      </h1>
      {/* Shadow clone for effect */}
      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-accent absolute top-0 left-1 opacity-0 group-hover:opacity-50 transition-opacity duration-100 mix-blend-multiply z-0">
        {title}
      </h1>
      {subtitle && (
        <p className="mono text-accent mt-4 text-sm border-l-2 border-accent pl-4 max-w-xl">
          // {subtitle}
        </p>
      )}
    </div>
  );
};

export default GlitchHeader;