"use client";

import { useCallback, useEffect } from "react";
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
}: QuestionCardProps) {
  // Play sound on answer
  useEffect(() => {
    if (isAnswered && isCorrect !== null) {
      playSoundIfEnabled(isCorrect ? "correct" : "incorrect");
    }
  }, [isAnswered, isCorrect]);

  // Wrap onAnswer to add sound
  const handleAnswer = useCallback((correct: boolean, answer: UserAnswer) => {
    onAnswer(correct, answer);
  }, [onAnswer]);

  // Handle bookmark toggle
  const handleToggleBookmark = useCallback(() => {
    if (questionIndex >= 0) {
      toggleBookmark(questionIndex);
    }
  }, [questionIndex]);

  // Keyboard shortcuts for navigation
  useKeyboardShortcuts({
    onNext,
    onPrevious,
    onToggleBookmark: handleToggleBookmark,
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
            {showBookmark && questionIndex >= 0 && (
              <BookmarkButton questionIndex={questionIndex} size="sm" />
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
