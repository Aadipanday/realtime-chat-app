import React from "react";

export const Avatar = ({
  src,
  alt = "User",
  isOnline = false,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
  };

  const badgeSizes = {
    xs: "w-2 h-2 ring-1",
    sm: "w-2.5 h-2.5 ring-1",
    md: "w-3 h-3 ring-2",
    lg: "w-3.5 h-3.5 ring-2",
    xl: "w-4 h-4 ring-2",
  };

  const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
    alt || "user"
  )}`;

  const safeSrc = src ? src.replace(/^http:\/\//i, "https://") : fallbackAvatar;

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <img
        src={safeSrc}
        alt={alt}
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover bg-[var(--bg-active)]`}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = fallbackAvatar;
        }}
      />
      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 ${badgeSizes[size] || badgeSizes.md} rounded-full bg-[var(--accent-color)] ring-[var(--bg-secondary)]`}
          title="Online"
        />
      )}
    </div>
  );
};
