"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StatsOverview, UserTable } from "@/components/admin";
import { StudySetTypeBadge } from "@/components/sets";
import { cn } from "@/lib/utils";

interface AdminStats {
  totals: {
    users: number;
    studySets: number;
    cards: number;
    progress: number;
  };
  byType: {
    sets: Record<string, number>;
    users: Record<string, number>;
  };
  recent: {
    usersLast30Days: number;
    setsLast30Days: number;
  };
  topSets: Array<{
    id: string;
    title: string;
    type: "SYSTEM" | "PUBLIC" | "PRIVATE";
    cardCount: number;
  }>;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    role: "ADMIN" | "USER";
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/stats");
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error("Failed to fetch statistics");
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-[var(--bg-secondary)] rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-[var(--bg-secondary)] rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-[var(--bg-secondary)] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="card p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-[var(--error-text)] mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {error}
          </h2>
          <p className="text-[var(--text-muted)] mb-4">
            You need admin privileges to access this page.
          </p>
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
          Admin Dashboard
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Platform overview and statistics
        </p>
      </div>

      {/* Stats Overview */}
      <StatsOverview stats={stats} />

      {/* Bottom sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Top Study Sets */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">
              Top Study Sets
            </h3>
            <Link
              href="/admin/sets"
              className="text-sm text-[var(--text-accent)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {stats.topSets.map((set, i) => (
              <div
                key={set.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <span
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                    i === 0 && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                    i === 1 && "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
                    i === 2 && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
                    i > 2 && "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">
                    {set.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <StudySetTypeBadge type={set.type} size="sm" />
                    <span className="text-xs text-[var(--text-muted)]">
                      {set.cardCount} cards
                    </span>
                  </div>
                </div>
                <Link
                  href={`/sets/${set.id}`}
                  className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-[var(--text-muted)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">
              Recent Users
            </h3>
            <Link
              href="/admin/users"
              className="text-sm text-[var(--text-accent)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {(user.name?.[0] || user.email[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">
                    {user.name || "Unnamed"}
                  </p>
                  <p className="text-sm text-[var(--text-muted)] truncate">
                    {user.email}
                  </p>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    user.role === "ADMIN"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
