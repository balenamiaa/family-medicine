"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { playSoundIfEnabled } from "@/lib/sounds";

interface FloatingNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isAnswered: boolean;
}

export function FloatingNavigation({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  isAnswered,
}: FloatingNavigationProps) {
  const handleNext = () => {
    if (canGoNext) {
      playSoundIfEnabled("navigate");
      onNext();
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      playSoundIfEnabled("navigate");
      onPrevious();
    }
  };

  // Progress percentage
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
      className="relative"
    >
      {/* Glassmorphic floating bar */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-500",
          "bg-[var(--bg-card)]/80 border-[var(--border-subtle)]",
          "shadow-lg shadow-black/5 dark:shadow-black/20",
          isAnswered && "border-[var(--border-accent)]/30"
        )}
      >
        {/* Progress bar background */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--bg-accent)]/10 to-[var(--bg-accent)]/5"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <div className="relative flex items-center justify-between gap-3 px-2 py-2 sm:px-4 sm:py-3">
          {/* Previous button */}
          <motion.button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            whileHover={canGoPrevious ? { scale: 1.02 } : {}}
            whileTap={canGoPrevious ? { scale: 0.98 } : {}}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-medium text-sm transition-all duration-200",
              canGoPrevious
                ? "bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] cursor-pointer"
                : "text-[var(--text-muted)]/40 cursor-not-allowed"
            )}
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Previous</span>
            <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 ml-1 text-[10px] rounded bg-[var(--bg-primary)]/50 text-[var(--text-muted)]">
              ←
            </kbd>
          </motion.button>

          {/* Center: Progress dots */}
          <div className="flex items-center gap-2">
            {/* Compact progress indicator */}
            <div className="flex items-center gap-1.5">
              {/* Progress ring */}
              <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="var(--border-subtle)"
                    strokeWidth="3"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="var(--bg-accent)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 100" }}
                    animate={{ strokeDasharray: `${progress} 100` }}
                    transition={{ duration: 0.5 }}
                    style={{ strokeDashoffset: 0 }}
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] sm:text-[10px] font-bold text-[var(--text-primary)] tabular-nums">
                    {currentIndex + 1}
                  </span>
                </div>
              </div>

              {/* Separator */}
              <span className="text-[var(--text-muted)] text-xs">/</span>

              {/* Total */}
              <span className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] tabular-nums">
                {totalQuestions}
              </span>
            </div>

            {/* Status indicator */}
            <AnimatePresence mode="wait">
              {isAnswered && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--success-bg)] border border-[var(--success-border)]"
                >
                  <svg className="w-3 h-3 text-[var(--success-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[10px] font-medium text-[var(--success-text)] hidden sm:inline">
                    Answered
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Next button */}
          <motion.button
            onClick={handleNext}
            disabled={!canGoNext}
            whileHover={canGoNext ? { scale: 1.02 } : {}}
            whileTap={canGoNext ? { scale: 0.98 } : {}}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-medium text-sm transition-all duration-200",
              canGoNext
                ? isAnswered
                  ? "bg-[var(--bg-accent)] hover:bg-[var(--bg-accent)]/90 text-[var(--text-inverse)] shadow-md shadow-[var(--bg-accent)]/20"
                  : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)]/40 cursor-not-allowed"
            )}
          >
            <span className="hidden sm:inline">{canGoNext ? "Next" : "Done"}</span>
            <svg
              className={cn(
                "w-4 h-4 transition-transform",
                canGoNext && "group-hover:translate-x-0.5"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 ml-1 text-[10px] rounded bg-[var(--bg-primary)]/50 text-[var(--text-muted)]">
              →
            </kbd>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
