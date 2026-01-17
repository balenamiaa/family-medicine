"use client";

import Link from "next/link";
import { ProgressRing, StreakCounter } from "@/components/ui";
import { cn } from "@/lib/utils";

interface LearnSidebarProps {
  streak?: number;
  maxStreak?: number;
  answeredCount?: number;
  totalQuestions?: number;
  correctCount?: number;
  className?: string;
}

export function LearnSidebar({
  streak = 0,
  maxStreak = 0,
  answeredCount = 0,
  totalQuestions = 0,
  correctCount = 0,
  className,
}: LearnSidebarProps) {
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Card */}
      <div className="card p-4">
        <h3 className="font-display text-sm font-medium text-[var(--text-secondary)] mb-3">
          Session Progress
        </h3>
        <div className="flex items-center gap-4">
          <ProgressRing value={answeredCount} max={totalQuestions} size={64} strokeWidth={4} />
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {answeredCount}
              <span className="text-sm font-normal text-[var(--text-muted)]">
                /{totalQuestions}
              </span>
            </p>
            <p className="text-sm text-[var(--text-muted)]">Questions</p>
          </div>
        </div>
      </div>

      {/* Streak Counter */}
      {streak > 0 && (
        <div className="card p-4">
          <StreakCounter streak={streak} maxStreak={maxStreak} />
        </div>
      )}

      {/* Quick Stats */}
      <div className="card p-4">
        <h3 className="font-display text-sm font-medium text-[var(--text-secondary)] mb-3">
          Accuracy
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                accuracy >= 70
                  ? "bg-[var(--success-bg)]"
                  : accuracy >= 50
                  ? "bg-[var(--warning-bg)]"
                  : "bg-[var(--error-bg)]"
              )}
              style={{ width: `${accuracy}%` }}
            />
          </div>
          <span className="text-sm font-medium text-[var(--text-primary)] min-w-[3rem] text-right">
            {accuracy}%
          </span>
        </div>
        <div className="mt-2 flex justify-between text-xs text-[var(--text-muted)]">
          <span>{correctCount} correct</span>
          <span>{answeredCount - correctCount} incorrect</span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-2">
        <Link
          href="/stats"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          View Statistics
        </Link>
        <Link
          href="/bookmarks"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Bookmarked Questions
        </Link>
      </div>
    </div>
  );
}
