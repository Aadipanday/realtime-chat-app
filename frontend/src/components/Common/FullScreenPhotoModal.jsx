import React, { useEffect } from "react";
import { X, Download, ExternalLink } from "lucide-react";

export const FullScreenPhotoModal = ({ isOpen, onClose, src, title = "Photo", subtitle = "" }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = src;
    link.download = `${title.replace(/\s+/g, "_").toLowerCase()}_photo.png`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/90 backdrop-blur-md p-4 sm:p-6 animate-in fade-in select-none"
    >
      {/* Top Header Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between w-full max-w-4xl mx-auto px-2 py-1 text-white shrink-0"
      >
        <div className="min-w-0 pr-4">
          <h3 className="text-sm font-semibold truncate text-white/95">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-white/60 truncate">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Download / View Original"
          >
            <Download size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Center Image Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex-1 flex items-center justify-center p-2 min-h-0"
      >
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <img
            src={src}
            alt={title}
            className="max-h-[82vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-200"
          />
        </div>
      </div>

      {/* Footer Info */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="text-center py-1 text-xs text-white/50 shrink-0"
      >
        Click anywhere outside or press Esc to close
      </div>
    </div>
  );
};
