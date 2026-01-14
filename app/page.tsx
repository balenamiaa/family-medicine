"use client";

import { useState, useMemo } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import {
  ThemeToggle,
  ProgressRing,
  StreakCounter,
  QuestionNavigator,
  ModeSwitcher,
} from "@/components/ui";
import { useQuiz } from "@/hooks/useQuiz";
import { QuestionBank, QuestionType, Difficulty, QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from "@/types";
import { cn, formatPercent } from "@/lib/utils";
import questionsData from "@/questions.json";

const questions = (questionsData as QuestionBank).questions;

const QUESTION_TYPES: QuestionType[] = ["mcq_single", "mcq_multi", "true_false", "emq", "cloze"];
const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4, 5];

export default function PracticePage() {
  // Filter state
  const [filterTypes, setFilterTypes] = useState<QuestionType[]>([]);
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  // Quiz hook
  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    answeredCount,
    correctCount,
    streak,
    maxStreak,
    answeredIndices,
    correctIndices,
    isAnswered,
    isCorrect,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    resetQuiz,
  } = useQuiz({
    questions,
    shuffleQuestions: isShuffled,
    filterTypes: filterTypes.length > 0 ? filterTypes : undefined,
    filterDifficulty: filterDifficulty.length > 0 ? filterDifficulty : undefined,
  });

  // Toggle filter
  const toggleTypeFilter = (type: QuestionType) => {
    setFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleDifficultyFilter = (diff: Difficulty) => {
    setFilterDifficulty((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );
  };

  // Question type counts
  const typeCounts = useMemo(() => {
    const counts: Record<QuestionType, number> = {
      mcq_single: 0,
      mcq_multi: 0,
      true_false: 0,
      emq: 0,
      cloze: 0,
    };
    questions.forEach((q) => counts[q.question_type]++);
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-accent)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--text-inverse)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                  MedCram
                </h1>
                <p className="text-xs text-[var(--text-muted)]">Family Medicine</p>
              </div>
            </div>

            {/* Mode Switcher */}
            <ModeSwitcher />

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Filter toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-ghost text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {(filterTypes.length > 0 || filterDifficulty.length > 0) && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-[var(--bg-accent)] text-[var(--text-inverse)] rounded-full">
                    {filterTypes.length + filterDifficulty.length}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsShuffled(!isShuffled);
                    resetQuiz();
                  }}
                  className={cn(
                    "btn btn-ghost text-sm",
                    isShuffled && "bg-[var(--bg-accent-subtle)] border-[var(--border-accent)]"
                  )}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Shuffle
                </button>
                <button
                  onClick={resetQuiz}
                  className="btn btn-ghost text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </div>
            </div>

            {/* Filters panel */}
            {showFilters && (
              <div className="card p-5 space-y-4 animate-scale-in">
                {/* Question types */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Question Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {QUESTION_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleTypeFilter(type)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          filterTypes.includes(type)
                            ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                            : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                        )}
                      >
                        {QUESTION_TYPE_LABELS[type]}
                        <span className="ml-1.5 opacity-60">({typeCounts[type]})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Difficulty</h3>
                  <div className="flex flex-wrap gap-2">
                    {DIFFICULTIES.map((diff) => (
                      <button
                        key={diff}
                        onClick={() => toggleDifficultyFilter(diff)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          filterDifficulty.includes(diff)
                            ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                            : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                        )}
                      >
                        {DIFFICULTY_LABELS[diff]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear filters */}
                {(filterTypes.length > 0 || filterDifficulty.length > 0) && (
                  <button
                    onClick={() => {
                      setFilterTypes([]);
                      setFilterDifficulty([]);
                    }}
                    className="text-sm text-[var(--text-accent)] hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Question card */}
            {currentQuestion ? (
              <QuestionCard
                key={currentIndex}
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                totalQuestions={totalQuestions}
                isAnswered={isAnswered}
                isCorrect={isCorrect}
                onAnswer={answerQuestion}
                onNext={nextQuestion}
                onPrevious={previousQuestion}
                canGoNext={currentIndex < totalQuestions - 1}
                canGoPrevious={currentIndex > 0}
              />
            ) : (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
                  No questions found
                </h2>
                <p className="text-[var(--text-muted)] mb-4">
                  Try adjusting your filters to see more questions.
                </p>
                <button
                  onClick={() => {
                    setFilterTypes([]);
                    setFilterDifficulty([]);
                  }}
                  className="btn btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Question navigator */}
            {totalQuestions > 0 && (
              <QuestionNavigator
                totalQuestions={totalQuestions}
                currentIndex={currentIndex}
                answeredIndices={answeredIndices}
                correctIndices={correctIndices}
                onNavigate={goToQuestion}
              />
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Progress card */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4">Your Progress</h3>

              <div className="flex items-center justify-center mb-6">
                <ProgressRing value={answeredCount} max={totalQuestions} size={100} strokeWidth={8} />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                    {correctCount}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">Correct</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                    {formatPercent(correctCount, answeredCount)}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">Accuracy</div>
                </div>
              </div>
            </div>

            {/* Streak */}
            <StreakCounter streak={streak} maxStreak={maxStreak} />

            {/* Tips card */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Study Tips</h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--text-accent)]">•</span>
                  <span>Use the memory tricks to build associations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--text-accent)]">•</span>
                  <span>Read explanations even when correct</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--text-accent)]">•</span>
                  <span>Take breaks every 25 questions</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Built for effective exam preparation. Good luck with your studies!
          </p>
        </div>
      </footer>
    </div>
  );
}
