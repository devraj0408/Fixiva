import React from 'react';

/**
 * BrandLogo - Ultra-Professional Fixiva Brand Emblem & Wordmark Typography
 * @param {string} mode - 'light' (dark text), 'dark' (white text), 'auto' (theme dynamic)
 * @param {number|string} height - Height of the logo in pixels (default: 36)
 * @param {boolean} iconOnly - Show only icon emblem
 * @param {string} className - Additional CSS classes
 */
const BrandLogo = ({ mode = 'auto', height = 36, iconOnly = false, className = '' }) => {
  const isDark = mode === 'dark';

  // Dynamic colors based on light vs dark mode
  const fixTextColorClass = isDark ? 'text-white' : 'text-slate-900 dark:text-white';
  const ivaTextColorClass = isDark ? 'text-emerald-400' : 'text-[#2F6B5F] dark:text-emerald-400';

  const numericHeight = Number(height) || 36;
  const iconSize = numericHeight;

  return (
    <div className={`inline-flex items-center gap-3 select-none font-sans group shrink-0 ${className}`}>
      {/* ---------------- ICON EMBLEM MARK ---------------- */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 group-hover:scale-105"
        role="img"
        aria-label="Fixiva Logo Icon"
      >
        <defs>
          <linearGradient id="fixiva-emblem-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2F6B5F" />
            <stop offset="100%" stopColor="#1F4E45" />
          </linearGradient>
        </defs>

        {/* Squircle Tile */}
        <rect width="36" height="36" rx="9.5" fill="url(#fixiva-emblem-grad)" />

        {/* House-Shield Frame */}
        <path
          d="M18 7.5 L29 15.8 V26 C29 27.8 27.6 29 25.8 29 H10.2 C8.4 29 7 27.8 7 26 V15.8 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* Roof Shield Amber Overhang */}
        <path
          d="M5.5 16.5 L18 7 L30.5 16.5"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center Checkmark */}
        <path
          d="M13 19 L16.8 22.8 L23.5 15.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* ---------------- WORDMARK TYPOGRAPHY ---------------- */}
      {!iconOnly && (
        <div className="flex flex-col leading-none justify-center">
          <span className="text-xl sm:text-2xl font-black tracking-tight font-sans">
            <span className={`${fixTextColorClass} transition-colors duration-200`}>Fix</span>
            <span className={`${ivaTextColorClass} transition-colors duration-200`}>iva</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
