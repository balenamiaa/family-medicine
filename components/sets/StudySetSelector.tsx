"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useStudySet } from "./StudySetProvider";
import { StudySetTypeBadge } from "./StudySetTypeBadge";

interface StudySetSelectorProps {
  className?: string;
}

export function StudySetSelector({ className }: StudySetSelectorProps) {
  const {
    sets,
    activeSet,
    activeSetId,
    isLoading,
    isLoadingActive,
    error,
    selectSet,
    refreshSets,
  } = useStudySet();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className={cn("card p-5 animate-pulse", className)}>
        <div className="h-4 w-40 bg-[var(--bg-secondary)] rounded mb-2" />
        <div className="h-6 w-2/3 bg-[var(--bg-secondary)] rounded mb-3" />
        <div className="h-4 w-1/3 bg-[var(--bg-secondary)] rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("card p-5 border-[var(--error-border)] bg-[var(--error-bg)]", className)}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--error-text)]">Study sets unavailable</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">{error}</p>
          </div>
          <button
            onClick={refreshSets}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-[var(--bg-card)] border border-[var(--border-subtle)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className={cn("card p-6 text-center", className)}>
        <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
          No study sets yet
        </h3>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Create or import a study set to start learning.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href="/sets/new" className="btn btn-primary text-sm">
            Create Study Set
          </Link>
          <Link href="/browse" className="btn btn-ghost text-sm">
            Browse Sets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card p-5 bg-[var(--bg-card)]/90", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Active Study Set
          </p>
          <div className="flex items-center gap-3 mt-2">
            <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              {activeSet?.title || "Select a study set"}
            </h3>
            {activeSet && <StudySetTypeBadge type={activeSet.type} size="sm" />}
          </div>
          {activeSet?.description && (
            <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">
              {activeSet.description}
            </p>
          )}
          {activeSet && (
            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
              <span>{activeSet.cardCount} cards</span>
              {activeSet.tags.length > 0 && (
                <span className="truncate">
                  {activeSet.tags.slice(0, 3).join(" · ")}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setIsOpen((open) => !open)}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
            "bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)]",
            "hover:bg-[var(--bg-card-hover)]"
          )}
        >
          {isOpen ? "Close" : "Switch"}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {sets.map((set) => {
              const isActive = set.id === activeSetId;
              return (
                <button
                  key={set.id}
                  onClick={() => {
                    selectSet(set.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left transition-all",
                    isActive
                      ? "border-[var(--border-accent)] bg-[var(--bg-accent-subtle)]"
                      : "border-[var(--border-subtle)] hover:border-[var(--border-accent)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">
                        {set.title}
                      </div>
                      {set.description && (
                        <div className="text-xs text-[var(--text-muted)] line-clamp-1 mt-1">
                          {set.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <StudySetTypeBadge type={set.type} size="sm" />
                      <span>{set.cardCount}</span>
                    </div>
                  </div>
                </button>
              );
            })}

            {isLoadingActive && (
              <div className="text-xs text-[var(--text-muted)]">
                Loading study set...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
