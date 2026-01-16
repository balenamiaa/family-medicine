"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { QuestionCard } from "@/components/QuestionCard";
import {
  ProgressRing,
  BookmarkButton,
} from "@/components/ui";
import { useQuiz } from "@/hooks/useQuiz";
import { getBookmarkedIndices, clearAllBookmarks } from "@/lib/bookmarks";
import { QuestionBank } from "@/types";
import { cn } from "@/lib/utils";
import questionsData from "@/questions.json";

const questions = (questionsData as QuestionBank).questions;

export default function BookmarksPage() {
  const [bookmarkedIndices, setBookmarkedIndices] = useState<number[]>([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setBookmarkedIndices(getBookmarkedIndices());
  }, [refreshKey]);

  const {
    currentQuestion,
    currentIndex,
    currentQuestionIndex,
    totalQuestions,
    answeredCount,
    correctCount,
    isAnswered,
    isCorrect,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    resetQuiz,
  } = useQuiz({
    questions,
    questionIndices: bookmarkedIndices,
    shuffleQuestions: false,
    persistKey: "medcram_bookmarks_progress",
  });

  const handleClearBookmarks = () => {
    clearAllBookmarks();
    setBookmarkedIndices([]);
    setShowConfirmClear(false);
    resetQuiz();
  };

  const handleBookmarkToggle = () => {
    // Refresh bookmarks list after toggle
    setTimeout(() => {
      setRefreshKey((k) => k + 1);
    }, 100);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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

            {bookmarkedIndices.length > 0 && (
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
                <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
                No bookmarks yet
              </h3>
              <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
                Press <kbd className="px-1.5 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded text-xs font-mono">B</kbd> while
                viewing any question to bookmark it for later review.
              </p>
              <Link href="/" className="btn btn-primary">
                Start Practicing
              </Link>
            </div>
          ) : (
            <>
              {/* Question card with bookmark button */}
              {currentQuestion && (
                <div className="relative">
                  {/* Bookmark button overlay */}
                  <div className="absolute top-4 right-4 z-10">
                    <BookmarkButton
                      questionIndex={currentQuestionIndex}
                      onToggle={handleBookmarkToggle}
                      size="lg"
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
                    onAnswer={answerQuestion}
                    onNext={nextQuestion}
                    onPrevious={previousQuestion}
                    canGoNext={currentIndex < totalQuestions - 1}
                    canGoPrevious={currentIndex > 0}
                  />
                </div>
              )}

              {/* Question list */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4">
                  All Bookmarks ({bookmarkedIndices.length})
                </h3>
                <div className="grid grid-cols-10 gap-2">
                  {bookmarkedIndices.map((qIndex, i) => (
                    <button
                      key={qIndex}
                      onClick={() => goToQuestion(i)}
                      className={cn(
                        "aspect-square rounded-lg text-sm font-medium transition-all",
                        i === currentIndex
                          ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                      )}
                    >
                      {qIndex + 1}
                    </button>
                  ))}
                </div>
              </div>
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

          {/* Tips */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Tips</h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--text-accent)]">•</span>
                <span>Press <kbd className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded text-xs">B</kbd> to toggle bookmark</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--text-accent)]">•</span>
                <span>Bookmark tricky questions to revisit later</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--text-accent)]">•</span>
                <span>Use bookmarks for targeted revision</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div className="flex gap-2">
            <Link href="/" className="btn btn-ghost flex-1 text-sm">
              Practice
            </Link>
            <Link href="/stats" className="btn btn-ghost flex-1 text-sm">
              Stats
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
