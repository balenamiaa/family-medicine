"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StudySetTypeBadge } from "@/components/sets";
import { cn } from "@/lib/utils";

interface StudySet {
  id: string;
  title: string;
  description: string | null;
  type: "SYSTEM" | "PUBLIC" | "PRIVATE";
  cardCount: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

type FilterType = "ALL" | "SYSTEM" | "PUBLIC" | "PRIVATE";

export default function AdminSetsPage() {
  const [sets, setSets] = useState<StudySet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/study-sets?include=user");
      if (!response.ok) throw new Error("Failed to fetch study sets");
      const data = await response.json();
      setSets(data.studySets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSets = sets.filter((set) => {
    const matchesType = filter === "ALL" || set.type === filter;
    const matchesSearch = search === "" ||
      set.title.toLowerCase().includes(search.toLowerCase()) ||
      set.description?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-[var(--bg-secondary)] rounded" />
          <div className="h-12 bg-[var(--bg-secondary)] rounded-xl" />
          <div className="h-96 bg-[var(--bg-secondary)] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="card p-12 text-center">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{error}</h2>
          <Link href="/admin/dashboard" className="btn btn-primary mt-4">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
            All Study Sets
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Manage all study sets across the platform
          </p>
        </div>
        <Link href="/admin/sets/new" className="btn btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Set
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sets..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)]"
            />
          </div>

          {/* Type filter */}
          <div className="flex gap-2">
            {(["ALL", "SYSTEM", "PUBLIC", "PRIVATE"] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  filter === type
                    ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-muted)]">
                  Title
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-muted)]">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-muted)]">
                  Cards
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-muted)]">
                  Owner
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-muted)]">
                  Updated
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredSets.map((set) => (
                <tr key={set.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{set.title}</p>
                      {set.description && (
                        <p className="text-sm text-[var(--text-muted)] truncate max-w-xs">
                          {set.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <StudySetTypeBadge type={set.type} size="sm" />
                  </td>
                  <td className="py-4 px-4 text-[var(--text-secondary)]">
                    {set.cardCount}
                  </td>
                  <td className="py-4 px-4">
                    {set.user ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                          {(set.user.name?.[0] || set.user.email[0]).toUpperCase()}
                        </div>
                        <span className="text-sm text-[var(--text-secondary)]">
                          {set.user.name || set.user.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-[var(--text-muted)]">
                    {formatDate(set.updatedAt)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/sets/${set.id}/cards`}
                        className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                        title="Edit cards"
                      >
                        <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <Link
                        href={`/sets/${set.id}`}
                        className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                        title="View details"
                      >
                        <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSets.length === 0 && (
          <div className="text-center py-12 text-[var(--text-muted)]">
            {search || filter !== "ALL"
              ? "No sets match your filters"
              : "No study sets yet"}
          </div>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-[var(--text-muted)] mt-4">
        Showing {filteredSets.length} of {sets.length} sets
      </p>
    </div>
  );
}
