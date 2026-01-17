"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
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
  const positionPercent = totalQuestions > 1
    ? Math.round((currentIndex / (totalQuestions - 1)) * 100)
    : 0;

  const indices = useMemo(
    () => Array.from({ length: displayCount }, (_, i) => i),
    [displayCount]
  );

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Quick Navigation
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
            <span className="tabular-nums">{answeredIndices.size}</span>
            <span className="text-[var(--text-muted)]">/</span>
            <span className="tabular-nums">{totalQuestions}</span>
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--success-bg)] ring-1 ring-inset ring-[var(--success-border)]" />
            <span>Correct</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--error-bg)] ring-1 ring-inset ring-[var(--error-border)]" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--bg-secondary)] ring-1 ring-inset ring-[var(--border-subtle)]" />
            <span>Unseen</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div
            className="h-full bg-[var(--bg-accent)] transition-all duration-300 ease-out rounded-full"
            style={{ width: `${positionPercent}%` }}
          />
        </div>
      </div>

      {/* Question grid */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12 gap-1.5">
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
                "h-8 rounded-md text-xs font-medium transition-all duration-100",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-accent)] focus-visible:ring-offset-1",
                isCurrent && [
                  "bg-[var(--bg-accent)] text-[var(--text-inverse)]",
                  "ring-2 ring-[var(--border-accent)] ring-offset-1 ring-offset-[var(--bg-card)]",
                  "shadow-sm",
                ],
                !isCurrent && isCorrect && [
                  "bg-[var(--success-bg)] text-[var(--success-text)]",
                  "hover:brightness-95",
                ],
                !isCurrent && isIncorrect && [
                  "bg-[var(--error-bg)] text-[var(--error-text)]",
                  "hover:brightness-95",
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

      {/* Expand/Collapse button */}
      {shouldCollapse && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full py-2 text-sm font-medium text-[var(--text-accent)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1.5"
        >
          {isExpanded ? (
            <>
              Show less
              <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.5} />
            </>
          ) : (
            <>
              Show all {totalQuestions} questions
              <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
