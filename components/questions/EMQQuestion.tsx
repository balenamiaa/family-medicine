"use client";

import { useState, useEffect, useCallback } from "react";
import { EMQQuestion as EMQQuestionType } from "@/types";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { playSoundIfEnabled } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface EMQQuestionProps {
  question: EMQQuestionType;
  onAnswer: (correct: boolean, answer: Record<number, number | null>) => void;
  answered: boolean;
}

const OPTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function EMQQuestion({ question, onAnswer, answered }: EMQQuestionProps) {
  const [selections, setSelections] = useState<Record<number, number | null>>({});
  const [activePremise, setActivePremise] = useState<number | null>(null);

  useEffect(() => {
    if (!answered) {
      setSelections({});
      setActivePremise(null);
    }
  }, [answered, question.instructions, question.premises, question.options]);

  // Create a map of correct matches
  const correctMatches = question.matches.reduce<Record<number, number>>((acc, [premiseIdx, optionIdx]) => {
    acc[premiseIdx] = optionIdx;
    return acc;
  }, {});

  const handlePremiseClick = useCallback((premiseIndex: number) => {
    if (answered) return;
    setActivePremise((prev) => (prev === premiseIndex ? null : premiseIndex));
  }, [answered]);

  const handleOptionClick = useCallback((optionIndex: number) => {
    if (answered || activePremise === null) return;

    setSelections((prev) => ({
      ...prev,
      [activePremise]: prev[activePremise] === optionIndex ? null : optionIndex,
    }));
    setActivePremise(null);
  }, [answered, activePremise]);

  const handleSubmit = useCallback(() => {
    const allAnswered = question.premises.every((_, i) => selections[i] !== undefined && selections[i] !== null);
    if (!allAnswered) return;

    const isCorrect = question.matches.every(([premiseIdx, optionIdx]) =>
      selections[premiseIdx] === optionIdx
    );

    onAnswer(isCorrect, selections);
  }, [question.premises, question.matches, selections, onAnswer]);

  const getPremiseState = (index: number): "default" | "active" | "correct" | "incorrect" => {
    if (!answered) {
      return activePremise === index ? "active" : "default";
    }

    return selections[index] === correctMatches[index] ? "correct" : "incorrect";
  };

  const allSelected = question.premises.every((_, i) => selections[i] !== undefined && selections[i] !== null);

  useKeyboardShortcuts({
    onSelectOption: handlePremiseClick,
    onSubmit: handleSubmit,
    optionCount: question.premises.length,
    isAnswered: answered,
    canSubmit: allSelected,
  });

  useEffect(() => {
    if (answered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (activePremise === null) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const key = e.key.toUpperCase();
      const optionIndex = OPTION_LETTERS.indexOf(key);
      if (optionIndex >= 0 && optionIndex < question.options.length) {
        e.preventDefault();
        playSoundIfEnabled("select");
        handleOptionClick(optionIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePremise, answered, handleOptionClick, question.options.length]);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        <p className="text-sm text-[var(--text-secondary)]">
          {question.instructions}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Premises */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Match each item
          </h4>
          <div className="space-y-2">
            {question.premises.map((premise, index) => {
              const state = getPremiseState(index);
              const selectedOption = selections[index];
              const correctOption = correctMatches[index];

              return (
                <button
                  key={index}
                  onClick={() => {
                    playSoundIfEnabled("select");
                    handlePremiseClick(index);
                  }}
                  disabled={answered}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-accent)]",

                    state === "default" && [
                      "bg-[var(--bg-card)] border-[var(--border-subtle)]",
                      !answered && "hover:border-[var(--border-accent)]",
                    ],
                    state === "active" && "bg-[var(--bg-accent-subtle)] border-[var(--border-accent)]",
                    state === "correct" && "bg-[var(--success-bg)] border-[var(--success-border)]",
                    state === "incorrect" && "bg-[var(--error-bg)] border-[var(--error-border)]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm text-[var(--text-primary)]">
                      {premise}
                    </span>
                    {selectedOption !== undefined && selectedOption !== null && (
                      <span
                        className={cn(
                          "flex-shrink-0 px-2 py-1 rounded text-xs font-bold",
                          state === "correct" && "bg-[var(--success-border)] text-white",
                          state === "incorrect" && "bg-[var(--error-border)] text-white",
                          state === "default" && "bg-[var(--bg-accent)] text-[var(--text-inverse)]",
                          state === "active" && "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                        )}
                      >
                        {OPTION_LETTERS[selectedOption]}
                      </span>
                    )}
                  </div>

                  {/* Show correct answer if wrong */}
                  {answered && state === "incorrect" && (
                    <div className="mt-2 text-xs text-[var(--success-text)]">
                      Correct: {OPTION_LETTERS[correctOption]} - {question.options[correctOption]}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            To these options
          </h4>
          <div className="space-y-2">
            {question.options.map((option, index) => {
              const isSelectedForActive = activePremise !== null && selections[activePremise] === index;

              return (
                <button
                  key={index}
                  onClick={() => {
                    playSoundIfEnabled("select");
                    handleOptionClick(index);
                  }}
                  disabled={answered || activePremise === null}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-accent)]",

                    activePremise === null && !answered && [
                      "bg-[var(--bg-secondary)] border-[var(--border-subtle)] opacity-60",
                    ],
                    activePremise !== null && !answered && [
                      "bg-[var(--bg-card)] border-[var(--border-subtle)]",
                      "hover:border-[var(--border-accent)] hover:bg-[var(--bg-card-hover)]",
                    ],
                    isSelectedForActive && "bg-[var(--bg-accent-subtle)] border-[var(--border-accent)]",
                    answered && "bg-[var(--bg-card)] border-[var(--border-subtle)]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                        isSelectedForActive
                          ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                          : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                      )}
                    >
                      {OPTION_LETTERS[index]}
                    </span>
                    <span className="flex-1 text-sm text-[var(--text-primary)]">
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit button */}
      {!answered && (
        <button
          onClick={handleSubmit}
          disabled={!allSelected}
          className={cn(
            "btn w-full py-4 text-base font-semibold rounded-xl transition-all duration-200",
            allSelected
              ? "btn-primary"
              : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
          )}
        >
          {allSelected
            ? "Check Answers"
            : `Match all items (${Object.values(selections).filter((v) => v !== null && v !== undefined).length}/${question.premises.length})`}
        </button>
      )}
    </div>
  );
}
