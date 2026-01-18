"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { QuestionCard } from "@/components/QuestionCard";
import { ProgressRing } from "@/components/ui";
import { StudySetSelector, useStudySet } from "@/components/sets";
import { startSession, recordQuestionAnswered } from "@/lib/stats";
import { playSoundIfEnabled } from "@/lib/sounds";
import { useQuiz } from "@/hooks/useQuiz";
import {
  getStoredData,
  getCardsNeedingReview,
  getStats,
  clearAllData,
  SpacedRepetitionData,
  overrideLastReviewQuality,
  Quality,
} from "@/lib/spacedRepetition";
import { cn } from "@/lib/utils";
import { scopedKey } from "@/lib/storage";

export default function ReviewPage() {
  const { activeSet, questions, isLoading, isLoadingActive, error } = useStudySet();
  const srKey = scopedKey("medcram_spaced_repetition", activeSet?.id);
  const statsKey = scopedKey("medcram_study_stats", activeSet?.id);
  const bookmarkKey = scopedKey("medcram_bookmarks", activeSet?.id);

  const [srData, setSrData] = useState<SpacedRepetitionData | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  // Lock the review indices at session start to prevent question changes mid-session
  const [sessionIndices, setSessionIndices] = useState<number[] | null>(null);

  // Load spaced repetition data
  useEffect(() => {
    if (!activeSet?.id) return;
    const data = getStoredData(srKey);
    setSrData(data);
    const cards = getCardsNeedingReview(data);
    setSessionIndices(cards.map((card) => card.questionIndex));
  }, [activeSet?.id, srKey, questions.length]);

  // Get questions that need review (for sidebar display only)
  const reviewCards = useMemo(() => {
    if (!srData) return [];
    return getCardsNeedingReview(srData);
  }, [srData]);

  // Use locked session indices for the quiz, not the dynamic reviewCards
  const reviewQuestionIndices = sessionIndices ?? [];

  const stats = useMemo(() => {
    if (!srData) return null;
    return getStats(srData);
  }, [srData]);

  // Quiz hook for review mode
  const {
    progress,
    currentQuestion,
    currentIndex,
    currentQuestionIndex,
    totalQuestions,
    answeredCount,
    correctCount,
    isAnswered,
    isCorrect,
    isFeedbackGiven,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    resetQuiz,
    resetSingleQuestion,
    markFeedbackGiven,
  } = useQuiz({
    questions,
    questionIndices: reviewQuestionIndices,
    shuffleQuestions: true,
    persistKey: scopedKey("medcram_review_progress", activeSet?.id),
    spacedRepetitionKey: srKey,
  });

  // Start session tracking
  useEffect(() => {
    if (!activeSet?.id) return;
    startSession(statsKey);
  }, [activeSet?.id, statsKey]);

  // Refresh data after answering
  const handleAnswer = (correct: boolean, answer: any) => {
    answerQuestion(correct, answer);
    recordQuestionAnswered(correct, 0, statsKey); // Streak not tracked in review mode
    // Refresh SR data immediately (no setTimeout to avoid race conditions)
    setSrData(getStoredData(srKey));
  };

  const handleResetQuestion = () => {
    if (!resetSingleQuestion) return;
    resetSingleQuestion(currentIndex);
    playSoundIfEnabled("click");
  };

  const handleFeedback = (quality: Quality) => {
    if (currentQuestionIndex < 0) return;
    overrideLastReviewQuality(currentQuestionIndex, quality, srKey);
    markFeedbackGiven();
    setSrData(getStoredData(srKey));
  };

  const handleClearData = () => {
    clearAllData(srKey);
    setSrData({ cards: {}, reviewHistory: [] });
    setSessionIndices([]);
    setShowConfirmClear(false);
    resetQuiz();
  };

  // Start a new review session with fresh indices
  const startNewSession = () => {
    const data = getStoredData(srKey);
    setSrData(data);
    const cards = getCardsNeedingReview(data);
    setSessionIndices(cards.map((card) => card.questionIndex));
    resetQuiz();
  };

  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    const diff = timestamp - Date.now();
    const hours = Math.abs(diff) / (1000 * 60 * 60);

    if (diff < 0) {
      if (hours < 1) return "Due now";
      if (hours < 24) return `${Math.round(hours)}h overdue`;
      return `${Math.round(hours / 24)}d overdue`;
    } else {
      if (hours < 1) return "Due soon";
      if (hours < 24) return `Due in ${Math.round(hours)}h`;
      return `Due in ${Math.round(hours / 24)}d`;
    }
  };

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
            Unable to load review queue
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
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
                  Active Recall
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Review questions using spaced repetition
                </p>
              </div>

              {stats && stats.totalReviewed > 0 && (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="btn btn-ghost text-sm text-[var(--error-text)]"
                >
                  Clear History
                </button>
              )}
            </div>

          {/* Confirm clear dialog */}
          {showConfirmClear && (
            <div className="card p-5 border-[var(--error-border)] bg-[var(--error-bg)] animate-scale-in">
              <p className="text-sm text-[var(--text-primary)] mb-4">
                Are you sure you want to clear all review history? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClearData}
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

          {/* No questions to review */}
          {totalQuestions === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--success-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
                {stats && stats.totalReviewed > 0 ? "All caught up!" : "No review history yet"}
              </h3>
              <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
                {stats && stats.totalReviewed > 0
                  ? "You've reviewed all due questions. Come back later for more practice."
                  : "Start practicing in the Practice mode to build your review queue. Questions you get wrong will appear here for review."}
              </p>
              <Link href="/practice" className="btn btn-primary">
                Go to Practice
              </Link>
            </div>
          ) : (
            <>
              {/* Question card */}
              {currentQuestion && (
                <QuestionCard
                  key={currentIndex}
                  question={currentQuestion}
                  questionNumber={currentIndex + 1}
                  questionIndex={currentQuestionIndex}
                  totalQuestions={totalQuestions}
                  isAnswered={isAnswered}
                  isCorrect={isCorrect}
                  userAnswer={progress.questionStates[currentIndex]?.userAnswer}
                  onAnswer={handleAnswer}
                  onNext={nextQuestion}
                  onPrevious={previousQuestion}
                  canGoNext={currentIndex < totalQuestions - 1}
                  canGoPrevious={currentIndex > 0}
                  onReset={handleResetQuestion}
                  bookmarkStorageKey={bookmarkKey}
                  onFeedback={handleFeedback}
                  feedbackGiven={isFeedbackGiven}
                />
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Review Stats */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4">Review Progress</h3>

            {totalQuestions > 0 && (
              <div className="flex items-center justify-center mb-6">
                <ProgressRing value={answeredCount} max={totalQuestions} size={100} strokeWidth={8} />
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-[var(--success-bg)]">
                <div className="text-xl font-bold text-[var(--success-text)] tabular-nums">
                  {stats?.mastered ?? 0}
                </div>
                <div className="text-xs text-[var(--text-muted)]">Mastered</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--bg-accent-subtle)]">
                <div className="text-xl font-bold text-[var(--text-accent)] tabular-nums">
                  {stats?.learning ?? 0}
                </div>
                <div className="text-xs text-[var(--text-muted)]">Learning</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--error-bg)]">
                <div className="text-xl font-bold text-[var(--error-text)] tabular-nums">
                  {stats?.struggling ?? 0}
                </div>
                <div className="text-xs text-[var(--text-muted)]">Struggling</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--bg-secondary)]">
                <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                  {stats?.dueNow ?? 0}
                </div>
                <div className="text-xs text-[var(--text-muted)]">Due Now</div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">How It Works</h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--text-accent)]">1.</span>
                <span>Questions you miss in Practice appear here</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--text-accent)]">2.</span>
                <span>Correct answers increase review intervals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--text-accent)]">3.</span>
                <span>Wrong answers reset for more practice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--text-accent)]">4.</span>
                <span>Master cards by answering correctly 3+ times</span>
              </li>
            </ul>
          </div>

          {/* Upcoming reviews */}
          {reviewCards.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Review Queue</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {reviewCards.slice(0, 10).map((card, i) => (
                  <div
                    key={card.questionIndex}
                    className={cn(
                      "flex items-center justify-between py-2 px-3 rounded-lg text-sm",
                      i === 0 && currentIndex === 0 && !isAnswered
                        ? "bg-[var(--bg-accent-subtle)] border border-[var(--border-accent)]"
                        : "bg-[var(--bg-secondary)]"
                    )}
                  >
                    <span className="text-[var(--text-secondary)]">
                      Q{card.questionIndex + 1}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        !card.lastAnsweredCorrect
                          ? "text-[var(--error-text)]"
                          : card.nextReviewDate <= Date.now()
                            ? "text-[var(--text-accent)]"
                            : "text-[var(--text-muted)]"
                      )}
                    >
                      {!card.lastAnsweredCorrect
                        ? "Needs review"
                        : formatRelativeTime(card.nextReviewDate)}
                    </span>
                  </div>
                ))}
                {reviewCards.length > 10 && (
                  <p className="text-xs text-[var(--text-muted)] text-center pt-2">
                    +{reviewCards.length - 10} more
                  </p>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
      )}
    </div>
  );
}
