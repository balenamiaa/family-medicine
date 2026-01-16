"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StudySetCard, StudySetTypeBadge } from "@/components/sets";
import { cn } from "@/lib/utils";

interface StudySet {
  id: string;
  title: string;
  description: string | null;
  type: "SYSTEM" | "PUBLIC" | "PRIVATE";
  tags: string[];
  cardCount: number;
  createdAt: string;
}

type FilterType = "all" | "SYSTEM" | "PUBLIC";

function BrowseContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>(
    typeParam === "SYSTEM" ? "SYSTEM" : typeParam === "PUBLIC" ? "PUBLIC" : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStudySets();
  }, []);

  const fetchStudySets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/study-sets");
      if (!response.ok) {
        throw new Error("Failed to fetch study sets");
      }
      const data = await response.json();
      setStudySets(data.studySets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter study sets
  const filteredSets = studySets.filter((set) => {
    // Type filter
    if (filter !== "all" && set.type !== filter) {
      return false;
    }
    // Only show PUBLIC and SYSTEM sets (not PRIVATE)
    if (set.type === "PRIVATE") {
      return false;
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        set.title.toLowerCase().includes(query) ||
        set.description?.toLowerCase().includes(query) ||
        set.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const systemSets = filteredSets.filter((s) => s.type === "SYSTEM");
  const publicSets = filteredSets.filter((s) => s.type === "PUBLIC");

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
          Browse Study Sets
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Discover study materials created by others
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search study sets..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "SYSTEM", "PUBLIC"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                filter === type
                  ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
              )}
            >
              {type === "all" ? "All" : type === "SYSTEM" ? "System" : "Community"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="h-6 w-2/3 bg-[var(--bg-secondary)] rounded" />
                <div className="h-5 w-16 bg-[var(--bg-secondary)] rounded-full" />
              </div>
              <div className="h-4 w-full bg-[var(--bg-secondary)] rounded mb-2" />
              <div className="h-4 w-3/4 bg-[var(--bg-secondary)] rounded mb-4" />
              <div className="h-4 w-24 bg-[var(--bg-secondary)] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--error-bg)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--error-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-2">
            Failed to load study sets
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
          <button onClick={fetchStudySets} className="btn btn-primary">
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredSets.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
            No study sets found
          </h2>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            {searchQuery
              ? "Try adjusting your search or filter criteria."
              : "There are no public study sets available yet."}
          </p>
        </div>
      )}

      {/* Study sets */}
      {!isLoading && !error && filteredSets.length > 0 && (
        <div className="space-y-8">
          {/* System sets section */}
          {(filter === "all" || filter === "SYSTEM") && systemSets.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Official Study Sets
                </h2>
                <StudySetTypeBadge type="SYSTEM" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {systemSets.map((set) => (
                  <StudySetCard
                    key={set.id}
                    id={set.id}
                    title={set.title}
                    description={set.description}
                    type={set.type}
                    cardCount={set.cardCount}
                    tags={set.tags}
                    href={`/sets/${set.id}`}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Public sets section */}
          {(filter === "all" || filter === "PUBLIC") && publicSets.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Community Sets
                </h2>
                <StudySetTypeBadge type="PUBLIC" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {publicSets.map((set) => (
                  <StudySetCard
                    key={set.id}
                    id={set.id}
                    title={set.title}
                    description={set.description}
                    type={set.type}
                    cardCount={set.cardCount}
                    tags={set.tags}
                    href={`/sets/${set.id}`}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <div className="h-8 w-48 bg-[var(--bg-secondary)] rounded animate-pulse" />
          <div className="h-4 w-64 bg-[var(--bg-secondary)] rounded animate-pulse mt-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="h-6 w-2/3 bg-[var(--bg-secondary)] rounded" />
                <div className="h-5 w-16 bg-[var(--bg-secondary)] rounded-full" />
              </div>
              <div className="h-4 w-full bg-[var(--bg-secondary)] rounded mb-2" />
              <div className="h-4 w-3/4 bg-[var(--bg-secondary)] rounded mb-4" />
              <div className="h-4 w-24 bg-[var(--bg-secondary)] rounded" />
            </div>
          ))}
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
