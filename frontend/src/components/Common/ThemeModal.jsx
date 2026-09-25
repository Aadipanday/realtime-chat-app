import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { X, Check } from "lucide-react";

export const ThemeModal = ({ isOpen, onClose }) => {
  const { theme, setTheme, themes } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Theme
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 pt-4">
          {themes.map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-[var(--accent-color)] bg-[var(--bg-active)] shadow-xs"
                    : "border-[var(--border-color)] hover:border-[var(--text-secondary)]/40 bg-[var(--bg-header)]/40 hover:bg-[var(--bg-active)]/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-5 h-5 rounded-full border border-white/20 shadow-inner"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="font-medium text-xs text-[var(--text-primary)]">
                    {t.name}
                  </span>
                </div>
                {isSelected && (
                  <Check size={18} className="text-[var(--accent-color)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
