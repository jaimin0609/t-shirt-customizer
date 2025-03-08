import React from 'react';
import { Link } from 'react-router-dom';

const LogoFooter = () => {
    return (
        <Link to="/" className="flex items-center space-x-3 group">
            {/* Logo Icon - SVG for crisp rendering */}
            <div className="relative flex-shrink-0">
                <div className="h-11 w-11 relative">
                    {/* SVG Logo */}
                    <svg viewBox="0 0 80 80" className="w-full h-full">
                        {/* Gradient definitions */}
                        <defs>
                            <linearGradient id="logoFooterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#60a5fa" /> {/* Lighter blue for better visibility on dark bg */}
                                <stop offset="100%" stopColor="#a78bfa" /> {/* Lighter purple for better visibility on dark bg */}
                            </linearGradient>
                            <filter id="footerGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="4" result="blur" /> {/* Stronger glow for dark background */}
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Main circle */}
                        <circle cx="40" cy="40" r="36" fill="url(#logoFooterGradient)"
                            className="transition-all duration-300 group-hover:filter" filter="url(#footerGlow)" />

                        {/* Orbital rings */}
                        <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"
                            className="animate-spin-slow" style={{ animationDuration: '30s' }} />
                        <circle cx="40" cy="40" r="24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"
                            className="animate-spin-slow" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />

                        {/* Orbiting dots */}
                        <circle cx="70" cy="40" r="3" fill="#facc15" className="animate-orbit-fast opacity-90" /> {/* Brighter yellow */}
                        <circle cx="40" cy="10" r="2" fill="#f9fafb" className="animate-orbit opacity-70"
                            style={{ animationDelay: '-2s' }} />

                        {/* UV letters */}
                        <text x="40" y="46" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle">
                            UV
                        </text>
                    </svg>

                    {/* Accent element */}
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full border-2 border-gray-800 shadow-md transition-all duration-300 transform group-hover:scale-110 z-10"></div>
                </div>
            </div>

            {/* Brand Name with refined typography */}
            <div className="font-bold text-xl tracking-tight transition-all duration-300 group-hover:tracking-wide">
                <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">UniQ</span>
                <span className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">Verse</span>
            </div>
        </Link>
    );
};

export default LogoFooter; 