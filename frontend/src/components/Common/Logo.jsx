import React from "react";

export const Logo = ({ size = "md", showText = true, showBadge = false, className = "" }) => {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const textSizes = {
    sm: "text-base font-bold",
    md: "text-lg font-bold",
    lg: "text-2xl font-bold",
    xl: "text-3xl font-extrabold",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon SVG */}
      <div className={`relative shrink-0 ${iconSizes[size] || iconSizes.md}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md transition-transform hover:scale-105 duration-300"
        >
          <defs>
            <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00a884" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e0e7ff" />
            </linearGradient>
          </defs>

          {/* Rounded base */}
          <rect width="100" height="100" rx="28" fill="url(#pulseGradient)" />

          {/* Chat bubble outline backdrop */}
          <path
            d="M26 34C26 27.3726 31.3726 22 38 22H62C68.6274 22 74 27.3726 74 34V52C74 58.6274 68.6274 64 62 64H44L30 76V63.5C27.5 61 26 57 26 52V34Z"
            fill="white"
            fillOpacity="0.15"
          />

          {/* White Chat Bubble */}
          <path
            d="M28 36C28 29.3726 33.3726 24 40 24H60C66.6274 24 72 29.3726 72 36V50C72 56.6274 66.6274 62 60 62H42L30 72V61C28.8 59 28 55.5 28 50V36Z"
            fill="url(#sparkGradient)"
          />

          {/* Lightning / Real-time pulse in center */}
          <path
            d="M52 31L39 47H48L44 63L61 45H50L52 31Z"
            fill="url(#pulseGradient)"
          />

          {/* Glowing pulse ring dot */}
          <circle cx="76" cy="24" r="8" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`${textSizes[size] || textSizes.md} tracking-tight bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent-color)] to-[var(--text-primary)] bg-clip-text text-transparent`}
            >
              PulseChat
            </span>
          </div>

          {showBadge && (
            <span className="text-[10px] font-medium tracking-wide text-[var(--accent-color)] flex items-center gap-1 mt-0.5">
              <span>⚡</span> powered by aadi
            </span>
          )}
        </div>
      )}
    </div>
  );
};
