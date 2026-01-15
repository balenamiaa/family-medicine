"use client";

import { useState, useRef, useEffect } from "react";
import { ClozeQuestion as ClozeQuestionType } from "@/types";
import { parseClozeText } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ClozeQuestionProps {
  question: ClozeQuestionType;
  onAnswer: (correct: boolean, answer: string[]) => void;
  answered: boolean;
}

export function ClozeQuestion({ question, onAnswer, answered }: ClozeQuestionProps) {
  const segments = parseClozeText(question.question_text);
  const blankCount = segments.filter((s) => s.type === "blank").length;

  const [answers, setAnswers] = useState<string[]>(Array(blankCount).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (answered) return;

    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Tab" && !e.shiftKey && index < blankCount - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Tab" && e.shiftKey && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allFilled) {
        handleSubmit();
      } else if (index < blankCount - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleSubmit = () => {
    if (!allFilled) return;

    const isCorrect = answers.every(
      (answer, i) => answer.toLowerCase().trim() === question.answers[i].toLowerCase().trim()
    );

    onAnswer(isCorrect, answers);
  };

  const allFilled = answers.every((a) => a.trim().length > 0);

  const getBlankState = (index: number): "default" | "correct" | "incorrect" => {
    if (!answered) return "default";

    const userAnswer = answers[index]?.toLowerCase().trim() ?? "";
    const correctAnswer = question.answers[index]?.toLowerCase().trim() ?? "";

    return userAnswer === correctAnswer ? "correct" : "incorrect";
  };

  let blankIndex = 0;

  return (
    <div className="space-y-6">
      {/* Cloze text with inputs */}
      <div className="p-5 sm:p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] leading-loose text-base sm:text-lg">
        {segments.map((segment, i) => {
          if (segment.type === "text") {
            return (
              <span key={i} className="text-[var(--text-primary)]">
                {segment.content}
              </span>
            );
          }

          const currentBlankIndex = blankIndex++;
          const state = getBlankState(currentBlankIndex);
          const correctAnswer = question.answers[currentBlankIndex];
          const isFocused = focusedIndex === currentBlankIndex;

          return (
            <span key={i} className="inline-flex items-baseline mx-0.5 my-1">
              <span className="relative group">
                {/* Underline-style input - compact and elegant */}
                <input
                  ref={(el) => { inputRefs.current[currentBlankIndex] = el; }}
                  type="text"
                  value={answered ? question.answers[currentBlankIndex] : answers[currentBlankIndex]}
                  onChange={(e) => handleInputChange(currentBlankIndex, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(currentBlankIndex, e)}
                  onFocus={() => setFocusedIndex(currentBlankIndex)}
                  onBlur={() => setFocusedIndex(null)}
                  disabled={answered}
                  placeholder={`___`}
                  className={cn(
                    // Compact underline style
                    "w-20 sm:w-24 px-1 py-0.5 text-center font-medium text-sm sm:text-base",
                    "bg-transparent border-b-2 rounded-none transition-all duration-300",
                    "focus:outline-none placeholder:text-[var(--text-muted)]/50",

                    // Default state - subtle underline
                    state === "default" && [
                      "border-[var(--border-accent)]/40 text-[var(--text-primary)]",
                      "hover:border-[var(--border-accent)]/60",
                      "focus:border-[var(--border-accent)]",
                      isFocused && "shadow-[0_2px_8px_-2px_var(--bg-accent)]"
                    ],

                    // Correct state - green success
                    state === "correct" && [
                      "border-[var(--success-border)] text-[var(--success-text)]",
                      "bg-[var(--success-bg)]/30 rounded-md px-2"
                    ],

                    // Incorrect state - red with strikethrough
                    state === "incorrect" && [
                      "border-[var(--error-border)] text-[var(--error-text)]",
                      "bg-[var(--error-bg)]/30 rounded-md px-2 line-through"
                    ]
                  )}
                  style={{
                    // Dynamic width based on answer length (min 80px, max 160px)
                    minWidth: answered
                      ? `${Math.max(80, Math.min(160, correctAnswer.length * 10 + 20))}px`
                      : undefined
                  }}
                />

                {/* Blank number indicator */}
                {!answered && (
                  <span className={cn(
                    "absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-medium transition-opacity duration-200",
                    isFocused ? "opacity-100 text-[var(--text-accent)]" : "opacity-40 text-[var(--text-muted)]"
                  )}>
                    {currentBlankIndex + 1}
                  </span>
                )}

                {/* Correct answer tooltip for incorrect responses */}
                {answered && state === "incorrect" && (
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] sm:text-xs text-[var(--success-text)] font-medium bg-[var(--success-bg)] px-1.5 py-0.5 rounded">
                    {correctAnswer}
                  </span>
                )}

                {/* Success indicator */}
                {answered && state === "correct" && (
                  <span className="absolute -right-4 top-1/2 -translate-y-1/2">
                    <svg className="w-3 h-3 text-[var(--success-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </span>
            </span>
          );
        })}
      </div>

      {/* Hint about number of blanks */}
      {!answered && (
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Fill {blankCount} blank{blankCount > 1 ? "s" : ""}
          </span>
          <span className="text-[var(--text-muted)]/50">•</span>
          <span className="text-xs">Tab to move between blanks</span>
        </div>
      )}

      {/* Submit button */}
      {!answered && (
        <button
          onClick={handleSubmit}
          disabled={!allFilled}
          className={cn(
            "btn w-full py-3.5 text-sm sm:text-base font-semibold rounded-xl transition-all duration-300",
            allFilled
              ? "btn-primary shadow-lg shadow-[var(--bg-accent)]/20 hover:shadow-[var(--bg-accent)]/30"
              : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
          )}
        >
          {allFilled ? (
            <span className="flex items-center justify-center gap-2">
              Check Answers
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white/20 rounded">Enter</kbd>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="tabular-nums">{answers.filter((a) => a.trim()).length}/{blankCount}</span>
              <span>blanks filled</span>
            </span>
          )}
        </button>
      )}
    </div>
  );
}
