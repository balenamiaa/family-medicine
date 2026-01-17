"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { StudySetSelector, useStudySet } from "@/components/sets";
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
import { getStats as getSRStats, getStoredData } from "@/lib/spacedRepetition";
import { cn } from "@/lib/utils";
import { scopedKey } from "@/lib/storage";

export default function StatsPage() {
  const { activeSet, questions, isLoading, isLoadingActive, error } = useStudySet();
  const statsKey = scopedKey("medcram_study_stats", activeSet?.id);
  const bookmarkKey = scopedKey("medcram_bookmarks", activeSet?.id);
  const srKey = scopedKey("medcram_spaced_repetition", activeSet?.id);

  const [stats, setStats] = useState<StudyStats | null>(null);
  const [recentStats, setRecentStats] = useState<DailyStats[]>([]);
  const [studyStreak, setStudyStreak] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [srStats, setSrStats] = useState<{ mastered: number; learning: number; struggling: number } | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [viewDays, setViewDays] = useState<7 | 14 | 30>(7);

  useEffect(() => {
    setStats(getStats(statsKey));
    setRecentStats(getRecentStats(30, statsKey));
    setStudyStreak(getStudyStreak(statsKey));
    setBookmarkCount(getBookmarkCount(bookmarkKey));

    const srData = getStoredData(srKey);
    const sr = getSRStats(srData);
    setSrStats(sr);
  }, [bookmarkKey, srKey, statsKey]);

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
    clearStats(statsKey);
    setStats(getStats(statsKey));
    setRecentStats(getRecentStats(30, statsKey));
    setStudyStreak(getStudyStreak(statsKey));
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <StudySetSelector />

      {isLoading || isLoadingActive ? (
        <div className="card p-6 animate-pulse">
          <div className="h-5 w-40 bg-[var(--bg-secondary)] rounded mb-3" />
          <div className="h-4 w-2/3 bg-[var(--bg-secondary)] rounded mb-6" />
          <div className="h-64 bg-[var(--bg-secondary)] rounded" />
        </div>
      ) : error ? (
        <div className="card p-6 border-[var(--error-border)] bg-[var(--error-bg)]">
          <h3 className="text-sm font-semibold text-[var(--error-text)] mb-2">
            Unable to load stats
          </h3>
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="card p-8 text-center">
          <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            No questions in this set
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Import questions or switch to another study set.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/sets" className="btn btn-ghost text-sm">
              Manage Sets
            </Link>
            <Link href="/browse" className="btn btn-primary text-sm">
              Browse Sets
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-[var(--text-accent)] tabular-nums">
              {studyStreak}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Day Streak</div>
          </div>

          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {stats?.totalQuestionsAnswered ?? 0}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Answered</div>
          </div>

          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-[var(--success-text)] tabular-nums">
              {stats ? Math.round((stats.totalCorrect / Math.max(stats.totalQuestionsAnswered, 1)) * 100) : 0}%
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Accuracy</div>
          </div>

          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {formatStudyTime(stats?.totalStudyTimeMs ?? 0)}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Study Time</div>
          </div>
        </div>

        {/* Focus stats */}
        <div className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Best streak</p>
              <p className="text-lg font-semibold text-[var(--text-accent)] tabular-nums">
                {stats?.longestStreak ?? 0} correct
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-muted)]">Bookmarks</p>
              <p className="text-lg font-semibold text-[var(--warning-text)] tabular-nums">
                {bookmarkCount}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-[var(--success-bg)] py-2">
              <div className="text-sm font-semibold text-[var(--success-text)] tabular-nums">
                {srStats?.mastered ?? 0}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Mastered</div>
            </div>
            <div className="rounded-lg bg-[var(--bg-accent-subtle)] py-2">
              <div className="text-sm font-semibold text-[var(--text-accent)] tabular-nums">
                {srStats?.learning ?? 0}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Learning</div>
            </div>
            <div className="rounded-lg bg-[var(--error-bg)] py-2">
              <div className="text-sm font-semibold text-[var(--error-text)] tabular-nums">
                {srStats?.struggling ?? 0}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Struggling</div>
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
            <div className="flex items-end gap-1 h-28">
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

          </div>

          {/* Summary for period */}
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-4 text-center">
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
        </div>

      )}
    </div>
  );
}
