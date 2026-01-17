"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Question,
  isMCQSingle,
  isMCQMulti,
  isTrueFalse,
  isEMQ,
  isCloze,
  UserAnswer,
} from "@/types";
import {
  DifficultyBadge,
  QuestionTypeBadge,
  RetentionAid,
  ExplanationPanel,
  BookmarkButton,
  FloatingNavigation,
} from "./ui";
import {
  MCQQuestion,
  TrueFalseQuestion,
  EMQQuestion,
  ClozeQuestion,
} from "./questions";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { playSoundIfEnabled } from "@/lib/sounds";
import { toggleBookmark } from "@/lib/bookmarks";
import { Quality } from "@/lib/spacedRepetition";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  questionIndex: number; // Original index in question bank
  totalQuestions: number;
  isAnswered: boolean;
  isCorrect: boolean | null;
  onAnswer: (correct: boolean, answer: UserAnswer) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  showBookmark?: boolean;
  bookmarkStorageKey?: string;
  onReset?: () => void;
  onFeedback?: (quality: Quality) => void;
}

export function QuestionCard({
  question,
  questionNumber,
  questionIndex,
  totalQuestions,
  isAnswered,
  isCorrect,
  onAnswer,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  showBookmark = true,
  bookmarkStorageKey,
  onReset,
  onFeedback,
}: QuestionCardProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // Play sound on answer
  useEffect(() => {
    if (isAnswered && isCorrect !== null) {
      playSoundIfEnabled(isCorrect ? "correct" : "incorrect");
    }
  }, [isAnswered, isCorrect]);

  useEffect(() => {
    setFeedbackGiven(false);
  }, [questionNumber, questionIndex]);

  // Wrap onAnswer to add sound
  const handleAnswer = useCallback((correct: boolean, answer: UserAnswer) => {
    onAnswer(correct, answer);
  }, [onAnswer]);

  // Handle bookmark toggle
  const handleToggleBookmark = useCallback(() => {
    if (questionIndex >= 0) {
      toggleBookmark(questionIndex, bookmarkStorageKey);
    }
  }, [questionIndex, bookmarkStorageKey]);

  const handleFeedback = useCallback((quality: Quality) => {
    if (!onFeedback) return;
    onFeedback(quality);
    setFeedbackGiven(true);
  }, [onFeedback]);

  // Keyboard shortcuts for navigation
  useKeyboardShortcuts({
    onNext,
    onPrevious,
    onToggleBookmark: handleToggleBookmark,
    onReset,
    isAnswered,
    canGoNext,
    canGoPrevious,
  });

  const renderQuestion = () => {
    if (isMCQSingle(question) || isMCQMulti(question)) {
      return (
        <MCQQuestion
          question={question}
          onAnswer={handleAnswer}
          answered={isAnswered}
        />
      );
    }

    if (isTrueFalse(question)) {
      return (
        <TrueFalseQuestion
          question={question}
          onAnswer={handleAnswer}
          answered={isAnswered}
        />
      );
    }

    if (isEMQ(question)) {
      return (
        <EMQQuestion
          question={question}
          onAnswer={handleAnswer}
          answered={isAnswered}
        />
      );
    }

    if (isCloze(question)) {
      return (
        <ClozeQuestion
          question={question}
          onAnswer={handleAnswer}
          answered={isAnswered}
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Card */}
      <div className="card p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-[var(--border-subtle)]">
          {/* Question counter */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--text-muted)]">
              Question
            </span>
            <span className="px-3 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold tabular-nums">
              {questionNumber} / {totalQuestions}
            </span>
          </div>

          {/* Badges and bookmark */}
          <div className="flex items-center gap-2">
            <QuestionTypeBadge type={question.question_type} />
            <DifficultyBadge difficulty={question.difficulty} size="sm" />
            {onReset && isAnswered && (
              <button
                onClick={onReset}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--bg-accent-subtle)] text-[var(--text-accent)] hover:bg-[var(--bg-accent)] hover:text-[var(--text-inverse)] transition-colors"
                title="Reset this question"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            )}
            {showBookmark && questionIndex >= 0 && (
              <BookmarkButton questionIndex={questionIndex} size="sm" storageKey={bookmarkStorageKey} />
            )}
          </div>
        </div>

        {/* Question content */}
        {renderQuestion()}
      </div>

      {/* Post-answer content */}
      {isAnswered && (
        <div className="space-y-4 stagger-children">
          {/* Retention aid */}
          <RetentionAid text={question.retention_aid} revealed />

          {/* Explanation */}
          <ExplanationPanel
            explanation={question.explanation}
            isCorrect={isCorrect ?? false}
            isVisible
          />

          {onFeedback && isCorrect === false && (
            <div className="card p-4 border-[var(--border-subtle)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    How close were you?
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Your feedback tunes the spaced repetition schedule.
                  </p>
                </div>
                {feedbackGiven && (
                  <span className="text-xs font-medium text-[var(--success-text)]">
                    Feedback saved
                  </span>
                )}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  { label: "Blanked", desc: "No recall", quality: 0 as Quality },
                  { label: "Felt familiar", desc: "Recognized it", quality: 1 as Quality },
                  { label: "Almost", desc: "Nearly had it", quality: 2 as Quality },
                ].map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleFeedback(option.quality)}
                    disabled={feedbackGiven}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left transition-all",
                      "border-[var(--border-subtle)] hover:border-[var(--border-accent)]",
                      feedbackGiven && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div className="text-xs font-semibold text-[var(--text-primary)]">
                      {option.label}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {option.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Navigation - always visible */}
      <FloatingNavigation
        currentIndex={questionNumber - 1}
        totalQuestions={totalQuestions}
        onPrevious={onPrevious}
        onNext={onNext}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        isAnswered={isAnswered}
      />
    </div>
  );
}
