"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import type { KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StudySetCard } from "@/components/sets";
import { SearchInput } from "@/components/ui";
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

type TagMode = "any" | "all";

type SortMode = "relevance" | "updated" | "newest" | "cards";

type DiscoverType = "SYSTEM" | "PUBLIC";

const PAGE_LIMIT = 18;

const TYPE_LABELS: Record<DiscoverType, string> = {
  SYSTEM: "Official",
  PUBLIC: "Community",
};

const SORT_LABELS: Record<SortMode, string> = {
  relevance: "Best match",
  updated: "Recently updated",
  newest: "Newest",
  cards: "Most cards",
};

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") ?? "";
  const initialAuthor = searchParams.get("author") ?? "";
  const initialTags = (searchParams.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const initialTagsMode = searchParams.get("tagsMode") === "all" ? "all" : "any";
  const initialTypesParam = searchParams.get("types") ?? searchParams.get("type");
  const initialTypes = initialTypesParam
    ? initialTypesParam
      .split(",")
      .map((type) => type.trim().toUpperCase())
      .filter((type): type is DiscoverType => type === "SYSTEM" || type === "PUBLIC")
    : (['SYSTEM', 'PUBLIC'] as DiscoverType[]);
  const initialSortParam = searchParams.get("sort") as SortMode | null;
  const initialSort: SortMode = initialSortParam && initialSortParam in SORT_LABELS
    ? initialSortParam
    : (initialQuery ? "relevance" : "updated");
  const initialMinCards = searchParams.get("minCards") ?? "";
  const initialMaxCards = searchParams.get("maxCards") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [author, setAuthor] = useState(initialAuthor);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [tagsMode, setTagsMode] = useState<TagMode>(initialTagsMode);
  const [selectedTypes, setSelectedTypes] = useState<DiscoverType[]>(initialTypes);
  const [sort, setSort] = useState<SortMode>(initialSort);
  const [minCards, setMinCards] = useState(initialMinCards);
  const [maxCards, setMaxCards] = useState(initialMaxCards);
  const [tagInput, setTagInput] = useState("");

  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    studySets.forEach((set) => {
      (set.tags ?? []).forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [studySets]);

  const activeTypeLabels = selectedTypes.length === 0
    ? ["All"]
    : selectedTypes.map((type) => TYPE_LABELS[type]);

  const hasActiveFilters = Boolean(
    query.trim()
    || author.trim()
    || selectedTags.length > 0
    || selectedTypes.length !== 2
    || minCards.trim()
    || maxCards.trim()
    || sort !== (query.trim() ? "relevance" : "updated")
    || (selectedTags.length > 0 && tagsMode === "all")
  );

  const updateUrl = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (author.trim()) params.set("author", author.trim());
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
    if (tagsMode === "all" && selectedTags.length > 0) params.set("tagsMode", "all");
    if (selectedTypes.length > 0 && selectedTypes.length < 2) {
      params.set("types", selectedTypes.join(","));
    }
    if (minCards.trim()) params.set("minCards", minCards.trim());
    if (maxCards.trim()) params.set("maxCards", maxCards.trim());
    if (sort !== (query.trim() ? "relevance" : "updated")) params.set("sort", sort);

    const queryString = params.toString();
    router.replace(queryString ? `/browse?${queryString}` : "/browse", { scroll: false });
  };

  useEffect(() => {
    updateUrl();
  }, [query, author, selectedTags, tagsMode, selectedTypes, minCards, maxCards, sort]);

  const fetchStudySets = async (nextOffset: number, append: boolean) => {
    try {
      setError(null);
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (author.trim()) params.set("author", author.trim());
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
      if (tagsMode === "all" && selectedTags.length > 0) params.set("tagsMode", "all");
      if (selectedTypes.length > 0 && selectedTypes.length < 2) {
        params.set("types", selectedTypes.join(","));
      }
      if (minCards.trim()) params.set("minCards", minCards.trim());
      if (maxCards.trim()) params.set("maxCards", maxCards.trim());
      if (sort) params.set("sort", sort);
      params.set("limit", PAGE_LIMIT.toString());
      params.set("offset", nextOffset.toString());

      const response = await fetch(`/api/study-sets/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch study sets");
      }

      const data = await response.json();
      setStudySets((prev) => append ? [...prev, ...(data.studySets || [])] : data.studySets || []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchStudySets(offset, offset > 0);
  }, [query, author, selectedTags, tagsMode, selectedTypes, minCards, maxCards, sort, offset]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setOffset(0);
  };

  const handleAuthorChange = (value: string) => {
    setAuthor(value);
    setOffset(0);
  };

  const toggleType = (type: DiscoverType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      const nextList = Array.from(next);
      return nextList.length === 0 ? ["SYSTEM", "PUBLIC"] : nextList;
    });
    setOffset(0);
  };

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSelectedTags((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
    setTagInput("");
    setOffset(0);
  };

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
    setOffset(0);
  };

  const handleTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagInput);
    }
  };

  const handleTagsModeChange = (mode: TagMode) => {
    setTagsMode(mode);
    setOffset(0);
  };

  const handleMinCardsChange = (value: string) => {
    setMinCards(value);
    setOffset(0);
  };

  const handleMaxCardsChange = (value: string) => {
    setMaxCards(value);
    setOffset(0);
  };

  const handleSortChange = (value: SortMode) => {
    setSort(value);
    setOffset(0);
  };

  const clearFilters = () => {
    setQuery("");
    setAuthor("");
    setSelectedTags([]);
    setTagsMode("any");
    setSelectedTypes(["SYSTEM", "PUBLIC"]);
    setMinCards("");
    setMaxCards("");
    setSort("updated");
    setOffset(0);
  };

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setOffset((prev) => prev + PAGE_LIMIT);
  };

  const handleToggleSave = async (setId: string, nextSaved: boolean) => {
    if (isSaving === setId) return;
    setIsSaving(setId);

    const previous = studySets;
    setStudySets((prev) => prev.map((set) =>
      set.id === setId ? { ...set, isSaved: nextSaved } : set
    ));

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
        throw new Error(data.error || "Failed to update saved status");
      }
    } catch (err) {
      setStudySets(previous);
      setError(err instanceof Error ? err.message : "Failed to update saved status");
    } finally {
      setIsSaving(null);
    }
  };

  const hasResults = studySets.length > 0;
  const hasMore = studySets.length < total;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8">
        <div className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-[var(--bg-accent)]/20 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-[var(--success-bg)]/40 blur-3xl" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Discover
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] mt-2">
            Find your next study set
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2 max-w-2xl">
            Search across official and community sets with precision filters, creator search,
            and tag logic. Save the gems to your personal library.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/" className="btn btn-ghost text-sm">
              View Library
            </Link>
            <Link href="/sets/new" className="btn btn-primary text-sm">
              Create Set
            </Link>
          </div>
        </div>
      </div>

      <div className="card p-6 relative overflow-hidden">
        <div className="absolute -top-24 right-16 h-32 w-32 rounded-full bg-[var(--color-teal-500)]/10 blur-2xl" />
        <div className="relative space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Advanced search
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {total} sets match your current filters.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>Types:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {activeTypeLabels.join(" · ")}
              </span>
            </div>
          </div>

          <SearchInput
            value={query}
            onChange={handleQueryChange}
            placeholder="Search topics, systems, procedures, tags, or creators..."
            debounceMs={250}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Types
              </span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TYPE_LABELS) as DiscoverType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={cn(
                      "px-3 py-2 rounded-full text-xs font-semibold transition-all",
                      selectedTypes.includes(type)
                        ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                    )}
                  >
                    {TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Creator
              </span>
              <input
                type="text"
                value={author}
                onChange={(event) => handleAuthorChange(event.target.value)}
                placeholder="Search by creator name or email"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)]"
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Sort
              </span>
              <select
                value={sort}
                onChange={(event) => handleSortChange(event.target.value as SortMode)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-accent)]"
              >
                {(Object.keys(SORT_LABELS) as SortMode[]).map((option) => (
                  <option key={option} value={option}>
                    {SORT_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Tags
              </span>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  onBlur={() => {
                    if (tagInput.trim()) addTag(tagInput);
                  }}
                  placeholder="Add tag and press Enter"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)]"
                />
                <div className="flex items-center gap-2">
                  {(["any", "all"] as TagMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleTagsModeChange(mode)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider",
                        tagsMode === mode
                          ? "bg-[var(--bg-accent-subtle)] text-[var(--text-accent)]"
                          : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                      )}
                    >
                      {mode === "any" ? "Match any" : "Match all"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Card volume
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  value={minCards}
                  onChange={(event) => handleMinCardsChange(event.target.value)}
                  placeholder="Min"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)]"
                />
                <input
                  type="number"
                  min={0}
                  value={maxCards}
                  onChange={(event) => handleMaxCardsChange(event.target.value)}
                  placeholder="Max"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)]"
                />
              </div>
            </div>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => removeTag(tag)}
                  className="px-3 py-1 rounded-full text-xs bg-[var(--bg-accent-subtle)] text-[var(--text-accent)]"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {popularTags.length > 0 && selectedTags.length === 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>Popular tags:</span>
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="px-2 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>Active filters:</span>
              {query.trim() && (
                <button
                  onClick={() => handleQueryChange("")}
                  className="px-2 py-1 rounded-full bg-[var(--bg-secondary)]"
                >
                  “{query.trim()}”
                </button>
              )}
              {author.trim() && (
                <button
                  onClick={() => handleAuthorChange("")}
                  className="px-2 py-1 rounded-full bg-[var(--bg-secondary)]"
                >
                  Creator: {author.trim()}
                </button>
              )}
              {selectedTags.length > 0 && (
                <span className="px-2 py-1 rounded-full bg-[var(--bg-secondary)]">
                  {tagsMode === "all" ? "Match all tags" : "Match any tag"}
                </span>
              )}
              {minCards.trim() && (
                <button
                  onClick={() => handleMinCardsChange("")}
                  className="px-2 py-1 rounded-full bg-[var(--bg-secondary)]"
                >
                  Min {minCards} cards
                </button>
              )}
              {maxCards.trim() && (
                <button
                  onClick={() => handleMaxCardsChange("")}
                  className="px-2 py-1 rounded-full bg-[var(--bg-secondary)]"
                >
                  Max {maxCards} cards
                </button>
              )}
              <button
                onClick={clearFilters}
                className="text-[var(--text-accent)] hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
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
      ) : error ? (
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
          <button onClick={() => fetchStudySets(0, false)} className="btn btn-primary">
            Try Again
          </button>
        </div>
      ) : !hasResults ? (
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
            {query
              ? "Try adjusting your search or filter criteria."
              : "There are no public study sets available yet."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button onClick={clearFilters} className="btn btn-ghost text-sm">
              Clear filters
            </button>
            <Link href="/sets/new" className="btn btn-primary text-sm">
              Create a Set
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Showing {studySets.length} of {total} sets</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-[var(--text-accent)] hover:underline">
                Reset filters
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
                isSaveDisabled={isSaving === set.id}
                href={`/sets/${set.id}`}
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

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
