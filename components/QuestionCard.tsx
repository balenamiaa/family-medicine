"use client";

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
} from "./ui";
import {
  MCQQuestion,
  TrueFalseQuestion,
  EMQQuestion,
  ClozeQuestion,
} from "./questions";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  isAnswered: boolean;
  isCorrect: boolean | null;
  onAnswer: (correct: boolean, answer: UserAnswer) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  isAnswered,
  isCorrect,
  onAnswer,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: QuestionCardProps) {
  const renderQuestion = () => {
    if (isMCQSingle(question) || isMCQMulti(question)) {
      return (
        <MCQQuestion
          question={question}
          onAnswer={onAnswer}
          answered={isAnswered}
        />
      );
    }

    if (isTrueFalse(question)) {
      return (
        <TrueFalseQuestion
          question={question}
          onAnswer={onAnswer}
          answered={isAnswered}
        />
      );
    }

    if (isEMQ(question)) {
      return (
        <EMQQuestion
          question={question}
          onAnswer={onAnswer}
          answered={isAnswered}
        />
      );
    }

    if (isCloze(question)) {
      return (
        <ClozeQuestion
          question={question}
          onAnswer={onAnswer}
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

          {/* Badges */}
          <div className="flex items-center gap-2">
            <QuestionTypeBadge type={question.question_type} />
            <DifficultyBadge difficulty={question.difficulty} size="sm" />
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

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className={cn(
                "btn btn-ghost px-6",
                !canGoPrevious && "opacity-50 cursor-not-allowed"
              )}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <button
              onClick={onNext}
              disabled={!canGoNext}
              className={cn(
                "btn btn-primary px-6",
                !canGoNext && "opacity-50 cursor-not-allowed"
              )}
            >
              {canGoNext ? "Next Question" : "Finished!"}
              {canGoNext && (
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
