import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center space-x-2 group">
      {/* Logo Icon - SVG for crisp rendering */}
      <div className="relative flex-shrink-0">
        <div className="h-10 w-10 relative">
          {/* SVG Logo */}
          <svg viewBox="0 0 80 80" className="w-full h-full">
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Main circle */}
            <circle cx="40" cy="40" r="36" fill="url(#logoGradient)"
              className="transition-all duration-300 group-hover:filter" filter="url(#glow)" />

            {/* Orbital rings */}
            <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"
              className="animate-spin-slow" style={{ animationDuration: '30s' }} />
            <circle cx="40" cy="40" r="24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"
              className="animate-spin-slow" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />

            {/* Orbiting dots */}
            <circle cx="70" cy="40" r="3" fill="#eab308" className="animate-orbit-fast opacity-90" />
            <circle cx="40" cy="10" r="2" fill="#f9fafb" className="animate-orbit opacity-50"
              style={{ animationDelay: '-2s' }} />

            {/* UV letters */}
            <text x="40" y="46" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle">
              UV
            </text>
          </svg>

          {/* Accent element */}
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full border-2 border-white shadow-sm transition-all duration-300 transform group-hover:scale-110 z-10"></div>
        </div>
      </div>

      {/* Brand Name with refined typography */}
      <div className="font-bold text-xl tracking-tight transition-all duration-300 group-hover:tracking-wide">
        <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">UniQ</span>
        <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">Verse</span>
      </div>
    </Link>
  );
};

export default Logo;

// Add this CSS to your global styles
const globalCss = `
@keyframes orbit-circular {
  0% {
    transform: rotate(0deg) translateX(12px) rotate(0deg);
  }
  100% {
    transform: rotate(360deg) translateX(12px) rotate(-360deg);
  }
}

.animate-orbit-circular {
  animation: orbit-circular 6s linear infinite;
}
`; 