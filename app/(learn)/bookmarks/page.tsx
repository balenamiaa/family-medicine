"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { QuestionCard } from "@/components/QuestionCard";
import {
  ProgressRing,
  BookmarkButton,
  QuestionNavigator,
  ToastNotice,
} from "@/components/ui";
import { StudySetSelector, useStudySet } from "@/components/sets";
import { useQuiz } from "@/hooks/useQuiz";
import { getBookmarkedIndices, clearAllBookmarks } from "@/lib/bookmarks";
import { playSoundIfEnabled } from "@/lib/sounds";
import { overrideLastReviewQuality, Quality } from "@/lib/spacedRepetition";
import { scopedKey } from "@/lib/storage";

export default function BookmarksPage() {
  const { activeSet, questions, isLoading, isLoadingActive, error } = useStudySet();
  const bookmarkKey = scopedKey("medcram_bookmarks", activeSet?.id);
  // Use the same progress key as practice so answers sync
  const progressKey = scopedKey("medcram_practice_progress", activeSet?.id);
  const srKey = scopedKey("medcram_spaced_repetition", activeSet?.id);

  const [bookmarkedIndices, setBookmarkedIndices] = useState<number[]>([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showResetToast, setShowResetToast] = useState(false);

  useEffect(() => {
    setBookmarkedIndices(getBookmarkedIndices(bookmarkKey));
  }, [bookmarkKey]);

  const validBookmarkedIndices = useMemo(() => {
    return bookmarkedIndices.filter((index) => index >= 0 && index < questions.length);
  }, [bookmarkedIndices, questions.length]);

  const {
    progress,
    currentQuestion,
    currentIndex,
    currentQuestionIndex,
    totalQuestions,
    answeredCount,
    correctCount,
    answeredIndices,
    correctIndices,
    isAnswered,
    isCorrect,
    isFeedbackGiven,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    resetQuiz,
    resetSingleQuestion,
    markFeedbackGiven,
    resetReason,
    clearResetReason,
  } = useQuiz({
    questions,
    questionIndices: validBookmarkedIndices,
    shuffleQuestions: false,
    persistKey: progressKey,
    spacedRepetitionKey: srKey,
  });

  useEffect(() => {
    if (resetReason === "content-change") {
      setShowResetToast(true);
      clearResetReason();
    }
  }, [resetReason, clearResetReason]);

  useEffect(() => {
    if (!showResetToast) return;
    const timer = window.setTimeout(() => setShowResetToast(false), 4500);
    return () => window.clearTimeout(timer);
  }, [showResetToast]);

  const handleClearBookmarks = () => {
    clearAllBookmarks(bookmarkKey);
    setBookmarkedIndices([]);
    setShowConfirmClear(false);
    resetQuiz();
  };

  const handleBookmarkToggle = () => {
    setBookmarkedIndices(getBookmarkedIndices(bookmarkKey));
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
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <StudySetSelector />
      {showResetToast && (
        <ToastNotice
          tone="warning"
          title="Study set updated"
          message="Your answers were cleared because this set changed."
          onDismiss={() => setShowResetToast(false)}
        />
      )}

      {isLoading || isLoadingActive ? (
        <div className="card p-6 animate-pulse">
          <div className="h-5 w-40 bg-[var(--bg-secondary)] rounded mb-3" />
          <div className="h-4 w-2/3 bg-[var(--bg-secondary)] rounded mb-6" />
          <div className="h-64 bg-[var(--bg-secondary)] rounded" />
        </div>
      ) : error ? (
        <div className="card p-6 border-[var(--error-border)] bg-[var(--error-bg)]">
          <h3 className="text-sm font-semibold text-[var(--error-text)] mb-2">
            Unable to load bookmarks
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
                  Bookmarked Questions
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Questions you&apos;ve saved for later review
                </p>
              </div>

            {validBookmarkedIndices.length > 0 && (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="btn btn-ghost text-sm text-[var(--error-text)]"
              >
                  Clear All
                </button>
              )}
            </div>

          {/* Confirm clear dialog */}
          {showConfirmClear && (
            <div className="card p-5 border-[var(--error-border)] bg-[var(--error-bg)] animate-scale-in">
              <p className="text-sm text-[var(--text-primary)] mb-4">
                Are you sure you want to remove all bookmarks? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClearBookmarks}
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

          {/* No bookmarks */}
          {totalQuestions === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                <Bookmark className="w-10 h-10 text-[var(--text-muted)]" />
              </div>
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
                No bookmarks yet
              </h3>
              <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
                Press <kbd className="px-1.5 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded text-xs font-mono">B</kbd> while
                viewing any question to bookmark it for later review.
              </p>
              <Link href="/practice" className="btn btn-primary">
                Start Practicing
              </Link>
            </div>
          ) : (
            <>
              {/* Quick navigation */}
              <QuestionNavigator
                totalQuestions={totalQuestions}
                currentIndex={currentIndex}
                answeredIndices={answeredIndices}
                correctIndices={correctIndices}
                onNavigate={goToQuestion}
              />

              {/* Question card with bookmark button */}
              {currentQuestion && (
                <div className="relative">
                  {/* Bookmark button overlay */}
                  <div className="absolute top-4 right-4 z-10">
                    <BookmarkButton
                      questionIndex={currentQuestionIndex}
                      onToggle={handleBookmarkToggle}
                      size="lg"
                      storageKey={bookmarkKey}
                    />
                  </div>

                  <QuestionCard
                    key={currentIndex}
                    question={currentQuestion}
                    questionNumber={currentIndex + 1}
                    questionIndex={currentQuestionIndex}
                    totalQuestions={totalQuestions}
                    isAnswered={isAnswered}
                    isCorrect={isCorrect}
                    userAnswer={progress.questionStates[currentIndex]?.userAnswer}
                    onAnswer={answerQuestion}
                    onNext={nextQuestion}
                    onPrevious={previousQuestion}
                    canGoNext={currentIndex < totalQuestions - 1}
                    canGoPrevious={currentIndex > 0}
                    showBookmark={false}
                    onReset={handleResetQuestion}
                    bookmarkStorageKey={bookmarkKey}
                    onFeedback={handleFeedback}
                    feedbackGiven={isFeedbackGiven}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Progress */}
          {totalQuestions > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4">Session Progress</h3>
              <div className="flex items-center justify-center mb-6">
                <ProgressRing value={answeredCount} max={totalQuestions} size={100} strokeWidth={8} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                    {correctCount}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">Correct</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                    {answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">Accuracy</div>
                </div>
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex gap-2">
            <Link href="/practice" className="btn btn-ghost flex-1 text-sm">
              Practice
            </Link>
            <Link href="/stats" className="btn btn-ghost flex-1 text-sm">
              Stats
            </Link>
          </div>
        </aside>
      </div>
      )}
    </div>
  );
}
