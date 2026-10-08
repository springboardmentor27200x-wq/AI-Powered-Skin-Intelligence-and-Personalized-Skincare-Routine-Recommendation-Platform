import React from 'react';
import { Link } from 'react-router-dom';

/**
 * DermaIQ BrandLogo Component
 * Features a luxurious, unique cutaneous shield droplet with an interlocking hexagonal
 * molecular lattice and radiant central intelligence star.
 * 100% Transparent Background - adapts cleanly to dark sidebars, light headers, and public pages.
 */
export const BrandLogoIcon = ({ size = 36, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${className}`}
      aria-label="DermaIQ Emblem"
    >
      <defs>
        {/* Jade / Emerald Primary Gradient */}
        <linearGradient id="dermaJadeGrad" x1="15" y1="10" x2="85" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e5a42" />
          <stop offset="45%" stopColor="#2a7d5c" />
          <stop offset="100%" stopColor="#123a2a" />
        </linearGradient>

        {/* Celestial Liquid Gold Metallic Gradient */}
        <linearGradient id="dermaGoldGrad" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#eed58e" />
          <stop offset="35%" stopColor="#d4af37" />
          <stop offset="70%" stopColor="#aa821e" />
          <stop offset="100%" stopColor="#f7e8b5" />
        </linearGradient>

        {/* Luminescent Mint Aqua Highlight */}
        <linearGradient id="dermaAquaGrad" x1="50" y1="20" x2="50" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.4" />
        </linearGradient>

        {/* Subtle Ambient Drop Shadow Filter */}
        <filter id="dermaGlow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1e5a42" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Outer Protective Cutaneous Shield & Botanical Leaf Silhouette */}
      <path
        d="M50 6 C66 6 88 20 88 48 C88 72 68 88 50 94 C32 88 12 72 12 48 C12 20 34 6 50 6 Z"
        fill="url(#dermaJadeGrad)"
        filter="url(#dermaGlow)"
      />

      {/* Inner Elegant Gold Inset Contour */}
      <path
        d="M50 12 C62 12 82 23 82 48 C82 68 64 82 50 87 C36 82 18 68 18 48 C18 23 38 12 50 12 Z"
        stroke="url(#dermaGoldGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Epidermal Cellular Hexagonal Symmetry */}
      <path
        d="M50 24 L68 35 L68 57 L50 68 L32 57 L32 35 Z"
        stroke="url(#dermaGoldGrad)"
        strokeWidth="1.8"
        strokeOpacity="0.8"
        fill="none"
      />

      {/* Internal Radial Lattice Connectors */}
      <path
        d="M50 24 L50 68 M32 35 L68 57 M68 35 L32 57"
        stroke="#5eead4"
        strokeWidth="1.2"
        strokeOpacity="0.45"
        strokeDasharray="2 3"
      />

      {/* Center Intelligence Droplet Contour */}
      <path
        d="M50 33 C56 40 61 47 61 53 C61 59 56 63 50 63 C44 63 39 59 39 53 C39 47 44 40 50 33 Z"
        fill="url(#dermaGoldGrad)"
      />

      {/* Central Radiance Core Sparkle (Neural Intelligence Node) */}
      <path
        d="M50 44 L52 50 L58 52 L52 54 L50 60 L48 54 L42 52 L48 50 Z"
        fill="#ffffff"
      />
      <circle cx="50" cy="52" r="1.5" fill="#1b382d" />

      {/* Top Apex Crown Pip */}
      <circle cx="50" cy="18" r="2.2" fill="url(#dermaGoldGrad)" />
      <circle cx="50" cy="18" r="1" fill="#ffffff" />
    </svg>
  );
};

export default function BrandLogo({
  size = 'md',
  showText = true,
  variant = 'full', // 'full' | 'compact' | 'icon'
  dark = false,     // true if rendered on dark background
  to = null,        // optional link URL
  className = '',
}) {
  const sizeMap = {
    sm: { icon: 28, text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 38, text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 46, text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 58, text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Emblem */}
      <BrandLogoIcon size={currentSize.icon} className="hover:scale-105 transition-transform" />

      {/* Typography */}
      {showText && variant !== 'icon' && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight leading-none ${currentSize.text} ${
                dark ? 'text-white' : 'text-[#163328]'
              }`}
            >
              Derma<span className="text-[#2b7d5a]">IQ</span>
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-[#d8eee2] text-[#1c5540] border border-[#b2ddc6] leading-none">
              AI
            </span>
          </div>
          {variant !== 'compact' && (
            <span
              className={`font-semibold tracking-wider uppercase mt-1 leading-none ${currentSize.sub} ${
                dark ? 'text-[#89a89c]' : 'text-[#486b5c]'
              }`}
            >
              Skincare Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block group focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
