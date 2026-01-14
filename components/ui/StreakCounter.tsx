"use client";

import { cn } from "@/lib/utils";

interface StreakCounterProps {
  streak: number;
  maxStreak: number;
}

export function StreakCounter({ streak, maxStreak }: StreakCounterProps) {
  const isHotStreak = streak >= 3;
  const isBurningStreak = streak >= 5;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300",
        isBurningStreak
          ? "bg-gradient-to-r from-orange-500/20 to-rose-500/20 border border-orange-500/30"
          : isHotStreak
            ? "bg-amber-500/15 border border-amber-500/30"
            : "bg-[var(--bg-secondary)] border border-[var(--border-subtle)]"
      )}
    >
      {/* Fire icon */}
      <div
        className={cn(
          "relative flex items-center justify-center w-8 h-8",
          isHotStreak && "animate-bounce-subtle"
        )}
      >
        <svg
          className={cn(
            "w-6 h-6 transition-colors duration-300",
            isBurningStreak
              ? "text-orange-500"
              : isHotStreak
                ? "text-amber-500"
                : "text-[var(--text-muted)]"
          )}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 23C7.03 23 3 18.97 3 14c0-3.21 1.88-6.14 4.8-7.82l.67-.38.18.73c.36 1.42 1.02 2.41 1.74 3.04-.28-1.64-.19-3.48.28-5.03.65-2.16 1.96-3.85 3.65-4.74L15 .5l.15.82c.23 1.22.3 2.47.2 3.74-.06.76-.19 1.53-.36 2.27.42-.63 1.15-1.5 2.15-2.26L18 4.33l.58.62c1.84 1.96 2.92 4.38 2.92 6.97 0 5.52-4.03 10.08-9.5 10.08z"/>
        </svg>

        {/* Glow effect for hot streaks */}
        {isHotStreak && (
          <div className="absolute inset-0 rounded-full bg-amber-500/30 blur-md animate-pulse" />
        )}
      </div>

      <div className="flex flex-col">
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
          Streak
        </span>
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "text-xl font-bold tabular-nums transition-colors",
              isBurningStreak
                ? "text-orange-500"
                : isHotStreak
                  ? "text-amber-500"
                  : "text-[var(--text-primary)]"
            )}
          >
            {streak}
          </span>
          {maxStreak > 0 && streak < maxStreak && (
            <span className="text-xs text-[var(--text-muted)]">
              / {maxStreak} best
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
