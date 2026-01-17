"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { QuestionCard } from "@/components/QuestionCard";
import {
  ProgressRing,
  StreakCounter,
  QuestionNavigator,
  SearchInput,
  KeyboardHints,
} from "@/components/ui";
import { StudySetSelector, useStudySet } from "@/components/sets";
import { useQuiz } from "@/hooks/useQuiz";
import { startSession, recordQuestionAnswered } from "@/lib/stats";
import { playSoundIfEnabled } from "@/lib/sounds";
import { overrideLastReviewQuality, Quality } from "@/lib/spacedRepetition";
import { QuestionType, Difficulty, QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, Question } from "@/types";
import { cn, formatPercent } from "@/lib/utils";
import { scopedKey } from "@/lib/storage";

const QUESTION_TYPES: QuestionType[] = ["mcq_single", "mcq_multi", "true_false", "emq", "cloze"];
const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4, 5];

// Search function to filter questions by keyword
function searchQuestions(questions: Question[], query: string): number[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const indices: number[] = [];

  questions.forEach((q, index) => {
    let searchText = "";

    // Get searchable text based on question type
    if ("question_text" in q) {
      searchText += q.question_text;
    }
    if ("instructions" in q) {
      searchText += " " + q.instructions;
    }
    if ("options" in q) {
      searchText += " " + q.options.join(" ");
    }
    if ("premises" in q) {
      searchText += " " + q.premises.join(" ");
    }
    searchText += " " + q.explanation + " " + q.retention_aid;

    if (searchText.toLowerCase().includes(lowerQuery)) {
      indices.push(index);
    }
  });

  return indices;
}

export default function PracticePage() {
  const { activeSet, questions, isLoading, isLoadingActive, error } = useStudySet();
  const progressKey = scopedKey("medcram_practice_progress", activeSet?.id);
  const statsKey = scopedKey("medcram_study_stats", activeSet?.id);
  const bookmarkKey = scopedKey("medcram_bookmarks", activeSet?.id);
  const srKey = scopedKey("medcram_spaced_repetition", activeSet?.id);

  // Filter state
  const [filterTypes, setFilterTypes] = useState<QuestionType[]>([]);
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Search results
  const searchIndices = useMemo(() => {
    return searchQuestions(questions, searchQuery);
  }, [questions, searchQuery]);

  // Start session tracking on mount
  useEffect(() => {
    if (!activeSet?.id) return;
    startSession(statsKey);
  }, [activeSet?.id, statsKey]);

  // Quiz hook
  const {
    currentQuestion,
    currentIndex,
    currentQuestionIndex,
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
    resetSingleQuestion,
  } = useQuiz({
    questions,
    shuffleQuestions: isShuffled,
    filterTypes: filterTypes.length > 0 ? filterTypes : undefined,
    filterDifficulty: filterDifficulty.length > 0 ? filterDifficulty : undefined,
    questionIndices: searchQuery.trim() ? searchIndices : undefined,
    persistKey: progressKey,
    spacedRepetitionKey: srKey,
  });

  // Track answered questions in stats
  const handleAnswer = (correct: boolean, answer: Parameters<typeof answerQuestion>[1]) => {
    answerQuestion(correct, answer);
    recordQuestionAnswered(correct, correct ? streak + 1 : 0, statsKey);
  };

  const handleResetQuestion = () => {
    if (!resetSingleQuestion) return;
    resetSingleQuestion(currentIndex);
    playSoundIfEnabled("click");
  };

  const handleFeedback = (quality: Quality) => {
    if (currentQuestionIndex < 0) return;
    overrideLastReviewQuality(currentQuestionIndex, quality, srKey);
  };

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
  }, [questions]);

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
            Unable to load questions
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
        <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Keyboard hints */}
            <KeyboardHints />

            {/* Search */}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search ${activeSet?.title ?? "questions"}...`}
            />

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
            <div className="card p-4 sm:p-5 space-y-4 animate-scale-in">
              {/* Question types */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Question Types</h3>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleTypeFilter(type)}
                      className={cn(
                        // Minimum 44px touch target on mobile
                        "min-h-[44px] px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                        filterTypes.includes(type)
                          ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] active:scale-95"
                      )}
                    >
                      {QUESTION_TYPE_LABELS[type]}
                      <span className="ml-1.5 opacity-60 hidden sm:inline">({typeCounts[type]})</span>
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
                        // Minimum 44px touch target on mobile
                        "min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                        filterDifficulty.includes(diff)
                          ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] active:scale-95"
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
                  className="min-h-[44px] px-4 py-2 text-sm text-[var(--text-accent)] hover:underline"
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
              questionIndex={currentQuestionIndex}
              totalQuestions={totalQuestions}
              isAnswered={isAnswered}
              isCorrect={isCorrect}
              onAnswer={handleAnswer}
              onNext={nextQuestion}
              onPrevious={previousQuestion}
              canGoNext={currentIndex < totalQuestions - 1}
              canGoPrevious={currentIndex > 0}
              onReset={handleResetQuestion}
              bookmarkStorageKey={bookmarkKey}
              onFeedback={handleFeedback}
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
      )}
    </div>
  );
}
