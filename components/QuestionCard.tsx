"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Question,
  isMCQSingle,
  isMCQMulti,
  isTrueFalse,
  isEMQ,
  isCloze,
  isWritten,
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
  WrittenQuestion,
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
  userAnswer?: UserAnswer;
  onAnswer: (correct: boolean, answer: UserAnswer) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  showBookmark?: boolean;
  bookmarkStorageKey?: string;
  onReset?: () => void;
  onFeedback?: (quality: Quality) => void;
  feedbackGiven?: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  questionIndex,
  totalQuestions,
  isAnswered,
  isCorrect,
  userAnswer,
  onAnswer,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  showBookmark = true,
  bookmarkStorageKey,
  onReset,
  onFeedback,
  feedbackGiven = false,
}: QuestionCardProps) {
  const feedbackOptions = [
    { label: "Again", desc: "No recall", quality: 0 as Quality, tone: "error" as const },
    { label: "Hard", desc: "Barely remembered", quality: 3 as Quality, tone: "warning" as const },
    { label: "Good", desc: "Correct with effort", quality: 4 as Quality, tone: "success" as const },
    { label: "Easy", desc: "Instant recall", quality: 5 as Quality, tone: "accent" as const },
  ];
  const feedbackShortcutEnabled = Boolean(onFeedback) && isAnswered && !feedbackGiven;
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [questionNumber, question.id]);

  // Play sound on answer
  useEffect(() => {
    if (isAnswered && isCorrect !== null) {
      playSoundIfEnabled(isCorrect ? "correct" : "incorrect");
    }
  }, [isAnswered, isCorrect]);

  // Wrap onAnswer to add sound
  const handleAnswer = useCallback((correct: boolean, answer: UserAnswer) => {
    onAnswer(correct, answer);

    if (question.id) {
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: question.id,
          correct,
          quality: correct ? 5 : 2,
        }),
        keepalive: true,
      });
    }
  }, [onAnswer, question]);

  // Handle bookmark toggle
  const handleToggleBookmark = useCallback(() => {
    if (questionIndex >= 0) {
      toggleBookmark(questionIndex, bookmarkStorageKey);
    }
  }, [questionIndex, bookmarkStorageKey]);

  const handleFeedback = useCallback((quality: Quality) => {
    if (!onFeedback) return;
    onFeedback(quality);
  }, [onFeedback]);

  // Keyboard shortcuts for navigation
  useKeyboardShortcuts({
    onNext,
    onPrevious,
    onToggleBookmark: handleToggleBookmark,
    onReset,
    onFeedback: feedbackShortcutEnabled ? handleFeedback : undefined,
    isAnswered,
    canGoNext,
    canGoPrevious,
    feedbackEnabled: feedbackShortcutEnabled,
    feedbackOptions: feedbackOptions.length,
    feedbackQualities: feedbackOptions.map((option) => option.quality),
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
      const clozeAnswer = Array.isArray(userAnswer) && userAnswer.every((item) => typeof item === "string")
        ? (userAnswer as string[])
        : undefined;
      return (
        <ClozeQuestion
          question={question}
          onAnswer={handleAnswer}
          answered={isAnswered}
          initialAnswer={clozeAnswer}
        />
      );
    }

    if (isWritten(question)) {
      return (
        <WrittenQuestion
          question={question}
          onAnswer={handleAnswer}
          answered={isAnswered}
        />
      );
    }

    return null;
  };

  return (
    <div ref={cardRef} className="space-y-6 animate-fade-in">
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

        {onFeedback && isAnswered && (
          <div className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/70 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Rate your recall
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  This tunes your review schedule (Anki-style).
                </p>
              </div>
              {feedbackGiven && (
                <span className="text-xs font-medium text-[var(--success-text)]">
                  Feedback saved
                </span>
              )}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {feedbackOptions.map((option, index) => (
                <button
                  key={option.label}
                  onClick={() => {
                    playSoundIfEnabled("select");
                    handleFeedback(option.quality);
                  }}
                  disabled={feedbackGiven}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left transition-all",
                    option.tone === "error" && "border-[var(--error-border)]/60 bg-[var(--error-bg)] hover:border-[var(--error-border)]",
                    option.tone === "warning" && "border-[var(--warning-border)]/60 bg-[var(--warning-bg)] hover:border-[var(--warning-border)]",
                    option.tone === "success" && "border-[var(--success-border)]/60 bg-[var(--success-bg)] hover:border-[var(--success-border)]",
                    option.tone === "accent" && "border-[var(--border-accent)]/60 bg-[var(--bg-accent-subtle)] hover:border-[var(--border-accent)]",
                    feedbackGiven && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 text-xs font-semibold",
                      option.tone === "error" && "text-[var(--error-text)]",
                      option.tone === "warning" && "text-[var(--warning-text)]",
                      option.tone === "success" && "text-[var(--success-text)]",
                      option.tone === "accent" && "text-[var(--text-accent)]"
                    )}
                  >
                    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-[var(--bg-card)] px-1 text-[10px] font-medium text-[var(--text-muted)]">
                      {index + 1}
                    </kbd>
                    <span>{option.label}</span>
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
