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

  // Group questions into rows for better visual organization
  const rows = useMemo(() => {
    const result: number[][] = [];
    for (let i = 0; i < displayCount; i += itemsPerRow) {
      result.push(
        Array.from({ length: Math.min(itemsPerRow, displayCount - i) }, (_, j) => i + j)
      );
    }
    return result;
  }, [displayCount, itemsPerRow]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--text-muted)]">
          Quick Navigation
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          {answeredIndices.size} of {totalQuestions} answered
        </span>
      </div>

      <div className="space-y-1.5">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap gap-1.5">
            {row.map((i) => {
              const isCurrent = i === currentIndex;
              const isAnswered = answeredIndices.has(i);
              const isCorrect = correctIndices.has(i);
              const isIncorrect = isAnswered && !isCorrect;

              return (
                <button
                  key={i}
                  onClick={() => onNavigate(i)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-medium transition-all duration-150",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-accent)]",

                    isCurrent && [
                      "bg-[var(--bg-accent)] text-[var(--text-inverse)]",
                      "ring-2 ring-[var(--border-accent)] ring-offset-2 ring-offset-[var(--bg-card)]",
                    ],

                    !isCurrent && isCorrect && [
                      "bg-[var(--success-bg)] text-[var(--success-text)]",
                      "border border-[var(--success-border)]/30",
                    ],

                    !isCurrent && isIncorrect && [
                      "bg-[var(--error-bg)] text-[var(--error-text)]",
                      "border border-[var(--error-border)]/30",
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
        ))}
      </div>

      {/* Expand/Collapse button */}
      {shouldCollapse && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 w-full py-2 text-sm font-medium text-[var(--text-accent)] hover:underline flex items-center justify-center gap-1"
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
