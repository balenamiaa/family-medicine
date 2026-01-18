"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchInput } from "@/components/ui";
import { StudySetCard } from "@/components/sets";
import { cn } from "@/lib/utils";

interface StudySet {
  id: string;
  title: string;
  description: string | null;
  type: "SYSTEM" | "PUBLIC" | "PRIVATE";
  tags: string[];
  cardCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  isSaved: boolean;
}

type FilterType = "all" | "SYSTEM" | "PUBLIC" | "PRIVATE";

const PAGE_LIMIT = 18;

export default function LearnHomePage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingSave, setIsTogglingSave] = useState<string | null>(null);

  const fetchSavedSets = async (nextOffset: number, append: boolean) => {
    try {
      setError(null);
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (filter !== "all") params.set("types", filter);
      params.set("limit", PAGE_LIMIT.toString());
      params.set("offset", nextOffset.toString());

      const response = await fetch(`/api/saved-sets?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch saved sets");
      }
      const data = await response.json();
      setStudySets((prev) => (append ? [...prev, ...(data.studySets || [])] : data.studySets || []));
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchSavedSets(offset, offset > 0);
  }, [query, filter, offset]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setOffset(0);
  };

  const handleFilterChange = (nextFilter: FilterType) => {
    setFilter(nextFilter);
    setOffset(0);
  };

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setOffset((prev) => prev + PAGE_LIMIT);
  };

  const handleToggleSave = async (setId: string, nextSaved: boolean) => {
    if (isTogglingSave) return;
    setIsTogglingSave(setId);

    const previous = studySets;
    const previousTotal = total;
    if (!nextSaved) {
      setStudySets((prev) => prev.filter((set) => set.id !== setId));
      setTotal((prev) => Math.max(prev - 1, 0));
    }

    try {
      const response = nextSaved
        ? await fetch("/api/saved-sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studySetId: setId }),
        })
        : await fetch(`/api/saved-sets?studySetId=${setId}`, { method: "DELETE" });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update library");
      }

      if (nextSaved) {
        setStudySets((prev) => prev.map((set) =>
          set.id === setId ? { ...set, isSaved: true } : set
        ));
      }
    } catch (err) {
      setStudySets(previous);
      setTotal(previousTotal);
      setError(err instanceof Error ? err.message : "Failed to update library");
    } finally {
      setIsTogglingSave(null);
    }
  };

  const hasResults = studySets.length > 0;
  const hasMore = studySets.length < total;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8">
        <div className="absolute -top-24 right-0 h-56 w-56 rounded-full bg-[var(--bg-accent)]/15 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-64 w-64 rounded-full bg-[var(--success-bg)]/40 blur-3xl" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Library</p>
          <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] mt-2">
            Your saved study sets
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2 max-w-xl">
            This space only shows the sets you&apos;ve saved. Discover more sets in the
            community library, then add them here with one tap.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/browse" className="btn btn-primary text-sm">
              Discover Sets
            </Link>
            <Link href="/sets/new" className="btn btn-ghost text-sm">
              Create Set
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SearchInput
          value={query}
          onChange={handleQueryChange}
          placeholder="Search your saved sets, tags, or creators..."
          className="max-w-2xl"
          debounceMs={250}
        />

        <div className="flex flex-wrap gap-2">
          {(["all", "SYSTEM", "PUBLIC", "PRIVATE"] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleFilterChange(type)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-all",
                filter === type
                  ? "bg-[var(--bg-accent)] text-[var(--text-inverse)] shadow-sm"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
              )}
            >
              {type === "all" ? "All saved" : type.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

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
                Library unavailable
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">{error}</p>
            </div>
            <button
              onClick={() => fetchSavedSets(0, false)}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-[var(--bg-card)] border border-[var(--border-subtle)]"
            >
              Retry
            </button>
          </div>
        </div>
      ) : !hasResults ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h6m-6 5h6m-6 5h6M15 7h6m-6 5h6m-6 5h6" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            No saved sets yet
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Save sets from Discover to build your personal library.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/browse" className="btn btn-primary text-sm">
              Discover Sets
            </Link>
            <button
              onClick={() => handleQueryChange("")}
              className="btn btn-ghost text-sm"
            >
              Clear Search
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Showing {studySets.length} of {total} saved sets</span>
            {query && (
              <button
                onClick={() => handleQueryChange("")}
                className="text-[var(--text-accent)] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {studySets.map((set) => (
              <StudySetCard
                key={set.id}
                id={set.id}
                title={set.title}
                description={set.description}
                type={set.type}
                cardCount={set.cardCount}
                tags={set.tags}
                creator={set.user ?? null}
                isSaved={set.isSaved}
                onToggleSave={handleToggleSave}
                isSaveDisabled={isTogglingSave === set.id}
                href={`/practice?set=${set.id}`}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border-subtle)]",
                  "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
                  "hover:bg-[var(--bg-card-hover)]",
                  isLoadingMore && "opacity-60 cursor-not-allowed"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  {isLoadingMore && (
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  Load more
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
