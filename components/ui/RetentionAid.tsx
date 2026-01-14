"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface RetentionAidProps {
  text: string;
  revealed?: boolean;
}

export function RetentionAid({ text, revealed = false }: RetentionAidProps) {
  const [isRevealed, setIsRevealed] = useState(revealed);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border transition-all duration-300",
        isRevealed
          ? "bg-[var(--bg-accent-subtle)] border-[var(--border-accent)]/40"
          : "bg-[var(--bg-secondary)] border-[var(--border-subtle)] cursor-pointer hover:border-[var(--border-accent)]/50"
      )}
      onClick={() => !isRevealed && setIsRevealed(true)}
      role={!isRevealed ? "button" : undefined}
      tabIndex={!isRevealed ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isRevealed && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          setIsRevealed(true);
        }
      }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
            isRevealed
              ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
              : "bg-[var(--border-default)] text-[var(--text-muted)]"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Memory Trick
          </div>

          {isRevealed ? (
            <p className="text-sm font-medium text-[var(--text-accent)] animate-fade-in">
              {text}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">
                Click to reveal
              </span>
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Shimmer effect when not revealed */}
      {!isRevealed && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
      )}
    </div>
  );
}
