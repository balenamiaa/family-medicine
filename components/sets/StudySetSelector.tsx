"use client";

import { useMemo, useState, useEffect } from "react";
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
  const [filterQuery, setFilterQuery] = useState("");
  const displaySet = activeSet ?? sets.find((set) => set.id === activeSetId) ?? null;

  useEffect(() => {
    if (!isOpen) {
      setFilterQuery("");
    }
  }, [isOpen]);

  const filteredSets = useMemo(() => {
    const normalized = filterQuery.trim().toLowerCase();
    if (!normalized) return sets;
    return sets.filter((set) => {
      const haystack = [
        set.title,
        set.description ?? "",
        ...(set.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [filterQuery, sets]);

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
              {displaySet?.title || "Select a study set"}
            </h3>
            {displaySet && <StudySetTypeBadge type={displaySet.type} size="sm" />}
            {isLoadingActive && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <span className="h-2 w-2 rounded-full bg-[var(--bg-accent)] animate-pulse" />
                Loading
              </span>
            )}
          </div>
          {displaySet?.description && (
            <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">
              {displaySet.description}
            </p>
          )}
          {displaySet && (
            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
              <span>{displaySet.cardCount} cards</span>
              {displaySet.tags.length > 0 && (
                <span className="truncate">
                  {displaySet.tags.slice(0, 3).join(" · ")}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setIsOpen((open) => !open)}
          disabled={isLoadingActive}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
            "bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)]",
            "hover:bg-[var(--bg-card-hover)]",
            isLoadingActive && "opacity-60 cursor-not-allowed"
          )}
          aria-busy={isLoadingActive}
        >
          <span className="flex items-center gap-2">
            {isLoadingActive && (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{isOpen ? "Close" : "Switch"}</span>
          </span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-3"
          >
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={filterQuery}
                onChange={(event) => setFilterQuery(event.target.value)}
                placeholder="Search your sets..."
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] pl-9 pr-10 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)] focus:outline-none"
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label="Clear search"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {filteredSets.length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--border-subtle)] px-4 py-3 text-xs text-[var(--text-muted)] text-center">
                No sets match your search.
              </div>
            )}

            {filteredSets.map((set) => {
              const isActive = set.id === activeSetId;
              return (
                <button
                  key={set.id}
                  onClick={() => {
                    selectSet(set.id);
                    setIsOpen(false);
                  }}
                  disabled={isLoadingActive}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left transition-all",
                    isActive
                      ? "border-[var(--border-accent)] bg-[var(--bg-accent-subtle)]"
                      : "border-[var(--border-subtle)] hover:border-[var(--border-accent)]",
                    isLoadingActive && "opacity-60 cursor-not-allowed"
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
