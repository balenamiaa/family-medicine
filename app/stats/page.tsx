"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ThemeToggle,
  ModeSwitcher,
  SoundToggle,
} from "@/components/ui";
import {
  getStats,
  getRecentStats,
  getStudyStreak,
  formatStudyTime,
  getAverageAccuracy,
  clearStats,
  DailyStats,
  StudyStats,
} from "@/lib/stats";
import { getBookmarkCount } from "@/lib/bookmarks";
import { getStats as getSRStats } from "@/lib/spacedRepetition";
import { cn } from "@/lib/utils";

export default function StatsPage() {
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [recentStats, setRecentStats] = useState<DailyStats[]>([]);
  const [studyStreak, setStudyStreak] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [srStats, setSrStats] = useState<{ mastered: number; learning: number; struggling: number } | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [viewDays, setViewDays] = useState<7 | 14 | 30>(7);

  useEffect(() => {
    setStats(getStats());
    setRecentStats(getRecentStats(30));
    setStudyStreak(getStudyStreak());
    setBookmarkCount(getBookmarkCount());

    const sr = getSRStats(null as never);
    if (sr) {
      setSrStats(sr);
    }
  }, []);

  const filteredRecentStats = useMemo(() => {
    return recentStats.slice(-viewDays);
  }, [recentStats, viewDays]);

  const averageAccuracy = useMemo(() => {
    return getAverageAccuracy(filteredRecentStats);
  }, [filteredRecentStats]);

  const maxQuestions = useMemo(() => {
    return Math.max(...filteredRecentStats.map((d) => d.questionsAnswered), 1);
  }, [filteredRecentStats]);

  const handleClearStats = () => {
    clearStats();
    setStats(getStats());
    setRecentStats([]);
    setStudyStreak(0);
    setShowConfirmClear(false);
  };

  // Fill in missing days for the chart
  const chartData = useMemo(() => {
    const days: DailyStats[] = [];
    const now = new Date();

    for (let i = viewDays - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const existing = filteredRecentStats.find((d) => d.date === dateStr);
      days.push(
        existing || {
          date: dateStr,
          questionsAnswered: 0,
          correctAnswers: 0,
          studyTimeMs: 0,
          sessions: 0,
        }
      );
    }

    return days;
  }, [filteredRecentStats, viewDays]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-accent)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--text-inverse)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                  MedCram
                </h1>
                <p className="text-xs text-[var(--text-muted)]">Study Statistics</p>
              </div>
            </div>

            <ModeSwitcher />

            <div className="flex items-center gap-2">
              <SoundToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
                Your Progress
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Track your study habits and performance
              </p>
            </div>

            {stats && stats.totalQuestionsAnswered > 0 && (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="btn btn-ghost text-sm text-[var(--error-text)]"
              >
                Clear Stats
              </button>
            )}
          </div>

          {/* Confirm clear dialog */}
          {showConfirmClear && (
            <div className="card p-5 border-[var(--error-border)] bg-[var(--error-bg)] animate-scale-in">
              <p className="text-sm text-[var(--text-primary)] mb-4">
                Are you sure you want to clear all statistics? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClearStats}
                  className="btn bg-[var(--error-border)] text-white text-sm"
                >
                  Yes, Clear All
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="btn btn-ghost text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-5 text-center">
              <div className="text-3xl font-bold text-[var(--text-accent)] tabular-nums">
                {studyStreak}
              </div>
              <div className="text-sm text-[var(--text-muted)] mt-1">Day Streak</div>
              {studyStreak > 0 && (
                <div className="mt-2 text-2xl">🔥</div>
              )}
            </div>

            <div className="card p-5 text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                {stats?.totalQuestionsAnswered ?? 0}
              </div>
              <div className="text-sm text-[var(--text-muted)] mt-1">Questions Answered</div>
            </div>

            <div className="card p-5 text-center">
              <div className="text-3xl font-bold text-[var(--success-text)] tabular-nums">
                {stats ? Math.round((stats.totalCorrect / Math.max(stats.totalQuestionsAnswered, 1)) * 100) : 0}%
              </div>
              <div className="text-sm text-[var(--text-muted)] mt-1">Overall Accuracy</div>
            </div>

            <div className="card p-5 text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                {formatStudyTime(stats?.totalStudyTimeMs ?? 0)}
              </div>
              <div className="text-sm text-[var(--text-muted)] mt-1">Total Study Time</div>
            </div>
          </div>

          {/* Additional stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Best Streak</h3>
              <div className="text-2xl font-bold text-[var(--text-accent)] tabular-nums">
                {stats?.longestStreak ?? 0} correct
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">Consecutive correct answers</p>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Bookmarked</h3>
              <div className="text-2xl font-bold text-[var(--warning-text)] tabular-nums">
                {bookmarkCount} questions
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">Saved for later review</p>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Spaced Repetition</h3>
              <div className="flex gap-4">
                <div>
                  <div className="text-xl font-bold text-[var(--success-text)] tabular-nums">
                    {srStats?.mastered ?? 0}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">Mastered</p>
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--text-accent)] tabular-nums">
                    {srStats?.learning ?? 0}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">Learning</p>
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--error-text)] tabular-nums">
                    {srStats?.struggling ?? 0}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">Struggling</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Daily Activity</h3>
              <div className="flex gap-2">
                {([7, 14, 30] as const).map((days) => (
                  <button
                    key={days}
                    onClick={() => setViewDays(days)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      viewDays === days
                        ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                    )}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            {/* Bar chart */}
            <div className="space-y-4">
              <div className="flex items-end gap-1 h-40">
                {chartData.map((day, i) => {
                  const height = (day.questionsAnswered / maxQuestions) * 100;
                  const accuracy = day.questionsAnswered > 0
                    ? (day.correctAnswers / day.questionsAnswered) * 100
                    : 0;

                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      <div className="relative w-full flex-1 flex items-end">
                        <div
                          className={cn(
                            "w-full rounded-t transition-all duration-300",
                            day.questionsAnswered > 0
                              ? accuracy >= 70
                                ? "bg-[var(--success-border)]"
                                : accuracy >= 50
                                  ? "bg-[var(--warning-text)]"
                                  : "bg-[var(--error-border)]"
                              : "bg-[var(--bg-secondary)]"
                          )}
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg shadow-lg p-2 text-xs whitespace-nowrap">
                            <div className="font-semibold text-[var(--text-primary)]">
                              {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </div>
                            <div className="text-[var(--text-secondary)]">
                              {day.questionsAnswered} questions
                            </div>
                            {day.questionsAnswered > 0 && (
                              <div className="text-[var(--text-muted)]">
                                {Math.round(accuracy)}% accuracy
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Day label */}
                      <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                        {new Date(day.date).toLocaleDateString("en-US", { weekday: "narrow" })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[var(--success-border)]" />
                  <span>≥70% accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[var(--warning-text)]" />
                  <span>50-69% accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[var(--error-border)]" />
                  <span>&lt;50% accuracy</span>
                </div>
              </div>
            </div>

            {/* Summary for period */}
            <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                  {filteredRecentStats.reduce((sum, d) => sum + d.questionsAnswered, 0)}
                </div>
                <div className="text-xs text-[var(--text-muted)]">Questions ({viewDays}d)</div>
              </div>
              <div>
                <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                  {Math.round(averageAccuracy)}%
                </div>
                <div className="text-xs text-[var(--text-muted)]">Avg Accuracy ({viewDays}d)</div>
              </div>
              <div>
                <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                  {formatStudyTime(filteredRecentStats.reduce((sum, d) => sum + d.studyTimeMs, 0))}
                </div>
                <div className="text-xs text-[var(--text-muted)]">Study Time ({viewDays}d)</div>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/" className="card p-5 hover:border-[var(--border-accent)] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-accent-subtle)] flex items-center justify-center group-hover:bg-[var(--bg-accent)] transition-colors">
                  <svg className="w-5 h-5 text-[var(--text-accent)] group-hover:text-[var(--text-inverse)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)]">Practice</h4>
                  <p className="text-xs text-[var(--text-muted)]">Continue studying</p>
                </div>
              </div>
            </Link>

            <Link href="/review" className="card p-5 hover:border-[var(--border-accent)] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-accent-subtle)] flex items-center justify-center group-hover:bg-[var(--bg-accent)] transition-colors">
                  <svg className="w-5 h-5 text-[var(--text-accent)] group-hover:text-[var(--text-inverse)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)]">Active Recall</h4>
                  <p className="text-xs text-[var(--text-muted)]">Review due cards</p>
                </div>
              </div>
            </Link>

            <Link href="/bookmarks" className="card p-5 hover:border-[var(--border-accent)] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-accent-subtle)] flex items-center justify-center group-hover:bg-[var(--bg-accent)] transition-colors">
                  <svg className="w-5 h-5 text-[var(--text-accent)] group-hover:text-[var(--text-inverse)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)]">Bookmarks</h4>
                  <p className="text-xs text-[var(--text-muted)]">{bookmarkCount} saved questions</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
