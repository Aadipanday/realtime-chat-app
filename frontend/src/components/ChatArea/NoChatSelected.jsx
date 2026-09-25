import React from "react";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "../Common/Logo";

export const NoChatSelected = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-between p-8 text-center bg-[var(--bg-secondary)] border-b-[6px] border-[var(--accent-color)] select-none">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md">
        {/* PulseChat Illustration / Logo */}
        <div className="relative mb-6">
          <Logo size="xl" showText={false} className="transform hover:scale-105 transition-transform" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2 flex items-center justify-center gap-2">
          PulseChat Web
        </h2>

        {/* Powered by aadi badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-semibold mb-5 border border-[var(--accent-color)]/20 shadow-xs">
          <Sparkles size={13} />
          <span>Powered by aadi</span>
        </div>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Send and receive real-time messages with instant socket synchronization.
          <br />
          Select a chat from the left or start a new conversation to begin.
        </p>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-header)] border border-[var(--border-color)]/60 text-xs text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-pulse" />
          Real-time Engine Active
        </div>
      </div>

      {/* Security & Powered by footer */}
      <div className="flex flex-col items-center gap-1 text-xs text-[var(--text-secondary)]/80 pt-4">
        <div className="flex items-center gap-1.5">
          <Lock size={13} />
          <span>Messages are encrypted in transit over secure connection</span>
        </div>
      </div>
    </div>
  );
};
