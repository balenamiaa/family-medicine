"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  correctIndices: Set<number>;
  onNavigate: (index: number) => void;
}

export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  answeredIndices,
  correctIndices,
  onNavigate,
}: QuestionNavigatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemsPerRow = 10;
  const collapsedRows = 3;
  const collapsedCount = itemsPerRow * collapsedRows;

  const shouldCollapse = totalQuestions > collapsedCount + 10;
  const displayCount = isExpanded || !shouldCollapse ? totalQuestions : collapsedCount;
  const answeredPercent = totalQuestions > 0
    ? Math.round((answeredIndices.size / totalQuestions) * 100)
    : 0;

  const indices = useMemo(
    () => Array.from({ length: displayCount }, (_, i) => i),
    [displayCount]
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-5">
      <div className="absolute -top-16 -right-12 h-40 w-40 rounded-full bg-[var(--color-amber-400)]/10 blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-[var(--color-teal-500)]/10 blur-2xl" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--bg-accent)] via-[var(--color-amber-500)] to-[var(--bg-accent)] opacity-70" aria-hidden="true" />

      <div className="relative flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Quick Navigation
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
            {answeredIndices.size}/{totalQuestions} answered
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--success-bg)] border border-[var(--success-border)]" />
            Correct
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--error-bg)] border border-[var(--error-border)]" />
            Missed
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)]" />
            Unseen
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--bg-accent)] to-[var(--color-amber-500)] transition-all duration-500"
            style={{ width: `${answeredPercent}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12 gap-2">
          {indices.map((i) => {
            const isCurrent = i === currentIndex;
            const isAnswered = answeredIndices.has(i);
            const isCorrect = correctIndices.has(i);
            const isIncorrect = isAnswered && !isCorrect;

            return (
              <button
                key={i}
                onClick={() => onNavigate(i)}
                className={cn(
                  "h-9 rounded-xl text-xs font-semibold transition-all duration-150",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-accent)]",
                  isCurrent && [
                    "bg-gradient-to-br from-[var(--bg-accent)] to-[var(--color-amber-500)] text-[var(--text-inverse)]",
                    "ring-2 ring-[var(--border-accent)] ring-offset-2 ring-offset-[var(--bg-card)]",
                    "shadow-md shadow-[var(--bg-accent)]/30",
                  ],
                  !isCurrent && isCorrect && [
                    "bg-[var(--success-bg)] text-[var(--success-text)]",
                    "border border-[var(--success-border)]/40",
                  ],
                  !isCurrent && isIncorrect && [
                    "bg-[var(--error-bg)] text-[var(--error-text)]",
                    "border border-[var(--error-border)]/40",
                  ],
                  !isCurrent && !isAnswered && [
                    "bg-[var(--bg-secondary)] text-[var(--text-muted)]",
                    "hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-secondary)]",
                  ]
                )}
                aria-label={`Go to question ${i + 1}${isAnswered ? (isCorrect ? " (correct)" : " (incorrect)") : ""}`}
                aria-current={isCurrent ? "true" : undefined}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expand/Collapse button */}
      {shouldCollapse && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full py-2 text-sm font-medium text-[var(--text-accent)] hover:underline flex items-center justify-center gap-1"
        >
          {isExpanded ? (
            <>
              Show less
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              Show all {totalQuestions} questions
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}
