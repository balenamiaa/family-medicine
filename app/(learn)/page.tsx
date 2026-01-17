"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchInput } from "@/components/ui";
import { StudySetCard, useStudySet } from "@/components/sets";

export default function LearnHomePage() {
  const { sets, isLoading, error, refreshSets } = useStudySet();
  const [query, setQuery] = useState("");

  const filteredSets = useMemo(() => {
    if (!query.trim()) return sets;
    const normalized = query.trim().toLowerCase();
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
  }, [query, sets]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">
            Choose a Study Set
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Pick a set to start practicing, reviewing, or running an exam.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/sets/new" className="btn btn-primary text-sm">
            Create Set
          </Link>
          <Link href="/browse" className="btn btn-ghost text-sm">
            Browse Sets
          </Link>
        </div>
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search study sets..."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 w-2/3 bg-[var(--bg-secondary)] rounded mb-3" />
              <div className="h-4 w-full bg-[var(--bg-secondary)] rounded mb-2" />
              <div className="h-4 w-1/2 bg-[var(--bg-secondary)] rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card p-6 border-[var(--error-border)] bg-[var(--error-bg)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--error-text)]">
                Study sets unavailable
              </h3>
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
      ) : filteredSets.length === 0 ? (
        <div className="card p-12 text-center">
          <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            No study sets match
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Try a different search or create a new set.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/sets/new" className="btn btn-primary text-sm">
              Create Study Set
            </Link>
            <button
              onClick={() => setQuery("")}
              className="btn btn-ghost text-sm"
            >
              Clear Search
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSets.map((set) => (
            <StudySetCard
              key={set.id}
              id={set.id}
              title={set.title}
              description={set.description}
              type={set.type}
              cardCount={set.cardCount}
              tags={set.tags}
              href={`/practice?set=${set.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
