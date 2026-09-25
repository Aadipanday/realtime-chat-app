import React from "react";
import { MessageSquare, Lock, Laptop } from "lucide-react";

export const NoChatSelected = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-between p-8 text-center bg-[var(--bg-secondary)] border-b-[6px] border-[var(--accent-color)] select-none">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md">
        {/* WhatsApp Web Illustration */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-[var(--bg-header)] flex items-center justify-center text-[var(--text-secondary)] shadow-sm">
            <Laptop size={48} className="text-[var(--text-secondary)]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-[var(--accent-color)] flex items-center justify-center text-[var(--accent-text)] shadow-md">
            <MessageSquare size={20} />
          </div>
        </div>

        <h2 className="text-2xl font-light text-[var(--text-primary)] mb-3">
          WhatsApp Web
        </h2>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Send and receive messages without keeping your phone online.
          <br />
          Experience seamless real-time messaging with instant synchronization.
        </p>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-header)] border border-[var(--border-color)]/60 text-xs text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-color)]" />
          Always active & connected
        </div>
      </div>

      {/* WhatsApp Encryption Footer */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]/80 pt-4">
        <Lock size={13} />
        <span>End-to-end encrypted</span>
      </div>
    </div>
  );
};
