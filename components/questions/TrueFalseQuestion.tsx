"use client";

import { useState, useCallback, useEffect } from "react";
import { TrueFalseQuestion as TFQuestion } from "@/types";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { playSoundIfEnabled } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface TrueFalseQuestionProps {
  question: TFQuestion;
  onAnswer: (correct: boolean, answer: boolean) => void;
  answered: boolean;
}

export function TrueFalseQuestion({ question, onAnswer, answered }: TrueFalseQuestionProps) {
  const [selected, setSelected] = useState<boolean | null>(null);

  useEffect(() => {
    if (!answered) {
      setSelected(null);
    }
  }, [answered, question.question_text, question.is_correct_true]);

  const handleSelect = useCallback((value: boolean) => {
    if (answered) return;
    setSelected(value);
  }, [answered]);

  const handleSelectByIndex = useCallback((index: number) => {
    handleSelect(index === 0); // 0 = True, 1 = False
  }, [handleSelect]);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const isCorrect = selected === question.is_correct_true;
    onAnswer(isCorrect, selected);
  }, [selected, question.is_correct_true, onAnswer]);

  // Keyboard shortcuts (T/F handled, 1/2 for True/False)
  useKeyboardShortcuts({
    onSelectOption: handleSelectByIndex,
    onSubmit: handleSubmit,
    optionCount: 2,
    isAnswered: answered,
    canSubmit: selected !== null,
  });

  const getButtonState = (value: boolean): "default" | "selected" | "correct" | "incorrect" => {
    if (!answered) {
      return selected === value ? "selected" : "default";
    }

    const isCorrectAnswer = question.is_correct_true === value;
    const wasSelected = selected === value;

    if (isCorrectAnswer) return "correct";
    if (wasSelected && !isCorrectAnswer) return "incorrect";
    return "default";
  };

  const buttonStyles = {
    default: "bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-accent)]",
    selected: "bg-[var(--bg-accent-subtle)] border-[var(--border-accent)]",
    correct: "bg-[var(--success-bg)] border-[var(--success-border)]",
    incorrect: "bg-[var(--error-bg)] border-[var(--error-border)]",
  };

  const textStyles = {
    default: "text-[var(--text-primary)]",
    selected: "text-[var(--text-accent)]",
    correct: "text-[var(--success-text)]",
    incorrect: "text-[var(--error-text)]",
  };

  return (
    <div className="space-y-6">
      {/* Question text */}
      <p className="text-lg leading-relaxed text-[var(--text-primary)]">
        {question.question_text}
      </p>

      {/* True/False buttons */}
      <div className="grid grid-cols-2 gap-4">
        {[true, false].map((value) => {
          const state = getButtonState(value);
          const isCorrectAnswer = answered && question.is_correct_true === value;
          const isWrongSelection = answered && selected === value && !isCorrectAnswer;

          return (
            <button
              key={value.toString()}
              onClick={() => {
                playSoundIfEnabled("select");
                handleSelect(value);
              }}
              disabled={answered}
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2",
                "transition-all duration-200 focus:outline-none focus-visible:ring-2",
                "focus-visible:ring-[var(--border-accent)] focus-visible:ring-offset-2",
                buttonStyles[state],
                answered && "cursor-default"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  state === "default" && "bg-[var(--bg-secondary)]",
                  state === "selected" && "bg-[var(--bg-accent)]",
                  state === "correct" && "bg-[var(--success-border)]",
                  state === "incorrect" && "bg-[var(--error-border)]"
                )}
              >
                {value ? (
                  <svg
                    className={cn(
                      "w-6 h-6",
                      state === "default" ? "text-[var(--text-muted)]" : "text-white"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg
                    className={cn(
                      "w-6 h-6",
                      state === "default" ? "text-[var(--text-muted)]" : "text-white"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              {/* Label */}
              <span className={cn("text-lg font-semibold", textStyles[state])}>
                {value ? "True" : "False"}
              </span>

              {/* Result indicator */}
              {isCorrectAnswer && (
                <span className="absolute top-2 right-2 text-xs font-medium text-[var(--success-text)] bg-[var(--success-border)]/20 px-2 py-1 rounded-full">
                  Correct
                </span>
              )}
              {isWrongSelection && (
                <span className="absolute top-2 right-2 text-xs font-medium text-[var(--error-text)] bg-[var(--error-border)]/20 px-2 py-1 rounded-full">
                  Your answer
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Submit button */}
      {!answered && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className={cn(
            "btn w-full py-4 text-base font-semibold rounded-xl transition-all duration-200",
            selected !== null
              ? "btn-primary"
              : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
          )}
        >
          Check Answer
          <span className="ml-2 text-xs opacity-70 hidden sm:inline">(Enter)</span>
        </button>
      )}
    </div>
  );
}
