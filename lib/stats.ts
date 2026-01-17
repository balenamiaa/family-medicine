// Study statistics tracking system

import { getStoredValue, setStoredValue } from "./utils";

const STATS_KEY = "medcram_study_stats";

function resolveKey(storageKey?: string): string {
  return storageKey ?? STATS_KEY;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD format
  questionsAnswered: number;
  correctAnswers: number;
  studyTimeMs: number;
  sessions: number;
}

export interface StudyStats {
  dailyStats: DailyStats[];
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalStudyTimeMs: number;
  longestStreak: number;
  currentSessionStart: number | null;
  lastActivityTimestamp: number | null;
}

function createEmptyStats(): StudyStats {
  return {
    dailyStats: [],
    totalQuestionsAnswered: 0,
    totalCorrect: 0,
    totalStudyTimeMs: 0,
    longestStreak: 0,
    currentSessionStart: null,
    lastActivityTimestamp: null,
  };
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getTodayStats(stats: StudyStats): DailyStats {
  const today = getToday();
  let todayStats = stats.dailyStats.find((d) => d.date === today);

  if (!todayStats) {
    todayStats = {
      date: today,
      questionsAnswered: 0,
      correctAnswers: 0,
      studyTimeMs: 0,
      sessions: 0,
    };
    stats.dailyStats.push(todayStats);

    // Keep only last 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoff = cutoffDate.toISOString().split("T")[0];
    stats.dailyStats = stats.dailyStats.filter((d) => d.date >= cutoff);
  }

  return todayStats;
}

export function getStats(storageKey?: string): StudyStats {
  return getStoredValue<StudyStats>(resolveKey(storageKey), createEmptyStats());
}

export function saveStats(stats: StudyStats, storageKey?: string): void {
  setStoredValue(resolveKey(storageKey), stats);
}

export function startSession(storageKey?: string): void {
  const stats = getStats(storageKey);
  const now = Date.now();

  // If there was no session or last activity was more than 5 minutes ago, start new session
  if (!stats.currentSessionStart || (stats.lastActivityTimestamp && now - stats.lastActivityTimestamp > 5 * 60 * 1000)) {
    stats.currentSessionStart = now;
    const todayStats = getTodayStats(stats);
    todayStats.sessions++;
  }

  stats.lastActivityTimestamp = now;
  saveStats(stats, storageKey);
}

export function recordStudyTime(storageKey?: string): void {
  const stats = getStats(storageKey);
  const now = Date.now();

  if (stats.lastActivityTimestamp && stats.currentSessionStart) {
    // Add time since last activity (max 2 minutes to account for idle time)
    const timeDiff = Math.min(now - stats.lastActivityTimestamp, 2 * 60 * 1000);
    const todayStats = getTodayStats(stats);
    todayStats.studyTimeMs += timeDiff;
    stats.totalStudyTimeMs += timeDiff;
  }

  stats.lastActivityTimestamp = now;
  saveStats(stats, storageKey);
}

export function recordQuestionAnswered(correct: boolean, streak: number, storageKey?: string): void {
  recordStudyTime(storageKey);

  const stats = getStats(storageKey);
  const todayStats = getTodayStats(stats);

  todayStats.questionsAnswered++;
  stats.totalQuestionsAnswered++;

  if (correct) {
    todayStats.correctAnswers++;
    stats.totalCorrect++;
  }

  if (streak > stats.longestStreak) {
    stats.longestStreak = streak;
  }

  stats.lastActivityTimestamp = Date.now();
  saveStats(stats, storageKey);
}

export function endSession(storageKey?: string): void {
  recordStudyTime(storageKey);
  const stats = getStats(storageKey);
  stats.currentSessionStart = null;
  saveStats(stats, storageKey);
}

// Get stats for the last N days
export function getRecentStats(days: number, storageKey?: string): DailyStats[] {
  const stats = getStats(storageKey);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString().split("T")[0];

  return stats.dailyStats
    .filter((d) => d.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Calculate streak (consecutive days with activity)
export function getStudyStreak(storageKey?: string): number {
  const stats = getStats(storageKey);
  if (stats.dailyStats.length === 0) return 0;

  const sorted = [...stats.dailyStats].sort((a, b) => b.date.localeCompare(a.date));
  const today = getToday();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Must have studied today or yesterday to have an active streak
  if (sorted[0].date !== today && sorted[0].date !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let expectedDate = new Date(sorted[0].date);

  for (const day of sorted) {
    const dayDate = new Date(day.date);
    const diffDays = Math.round((expectedDate.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0 && day.questionsAnswered > 0) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (diffDays > 0) {
      break;
    }
  }

  return streak;
}

// Format time duration
export function formatStudyTime(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Calculate average accuracy
export function getAverageAccuracy(dailyStats: DailyStats[]): number {
  const totals = dailyStats.reduce(
    (acc, day) => ({
      questions: acc.questions + day.questionsAnswered,
      correct: acc.correct + day.correctAnswers,
    }),
    { questions: 0, correct: 0 }
  );

  return totals.questions > 0 ? (totals.correct / totals.questions) * 100 : 0;
}

// Clear all stats
export function clearStats(storageKey?: string): void {
  saveStats(createEmptyStats(), storageKey);
}
