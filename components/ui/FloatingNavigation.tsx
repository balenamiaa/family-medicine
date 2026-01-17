"use client";

import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
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
  className?: string;
}

export function FloatingNavigation({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  isAnswered,
  className,
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

  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
      className={cn("relative", className)}
    >
      <div
        className={cn(
          "relative rounded-xl border bg-[var(--bg-card)] transition-colors duration-200",
          "border-[var(--border-subtle)]",
          isAnswered && "border-[var(--border-accent)]"
        )}
      >
        {/* Progress bar */}
        <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-xl bg-[var(--bg-secondary)]">
          <motion.div
            className="h-full bg-[var(--bg-accent)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        <div className="flex items-center justify-between gap-4 px-3 py-2.5 sm:px-4 sm:py-3">
          {/* Previous button */}
          <motion.button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            whileTap={canGoPrevious ? { scale: 0.95 } : {}}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors",
              canGoPrevious
                ? "bg-[var(--bg-button)] hover:bg-[var(--bg-button-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)]/30 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2} />
            <span className="hidden sm:inline">Previous</span>
          </motion.button>

          {/* Center: Progress */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <span className="text-[var(--text-primary)] tabular-nums">{currentIndex + 1}</span>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="text-[var(--text-muted)] tabular-nums">{totalQuestions}</span>
            </div>

            <AnimatePresence mode="wait">
              {isAnswered && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--success-bg)]"
                >
                  <Check className="w-3.5 h-3.5 text-[var(--success-text)]" strokeWidth={2.5} />
                  <span className="text-xs font-medium text-[var(--success-text)] hidden sm:inline">
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
            whileTap={canGoNext ? { scale: 0.95 } : {}}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors",
              canGoNext
                ? isAnswered
                  ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                  : "bg-[var(--bg-button)] hover:bg-[var(--bg-button-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)]/30 cursor-not-allowed"
            )}
          >
            <span className="hidden sm:inline">{canGoNext ? "Next" : "Done"}</span>
            <ChevronRight className="w-6 h-6" strokeWidth={2} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
