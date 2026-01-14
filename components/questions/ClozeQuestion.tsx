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
      <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] leading-relaxed text-lg">
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

          return (
            <span key={i} className="inline-block mx-1 align-bottom">
              <span className="relative">
                <input
                  ref={(el) => { inputRefs.current[currentBlankIndex] = el; }}
                  type="text"
                  value={answered ? question.answers[currentBlankIndex] : answers[currentBlankIndex]}
                  onChange={(e) => handleInputChange(currentBlankIndex, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(currentBlankIndex, e)}
                  disabled={answered}
                  placeholder={`(${currentBlankIndex + 1})`}
                  className={cn(
                    "w-40 px-3 py-1.5 rounded-lg border-2 text-center font-medium transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] focus:ring-offset-1",
                    "placeholder:text-[var(--text-muted)] placeholder:text-sm",

                    state === "default" && [
                      "bg-[var(--bg-secondary)] border-[var(--border-default)]",
                      "text-[var(--text-primary)]",
                    ],
                    state === "correct" && [
                      "bg-[var(--success-bg)] border-[var(--success-border)]",
                      "text-[var(--success-text)]",
                    ],
                    state === "incorrect" && [
                      "bg-[var(--error-bg)] border-[var(--error-border)]",
                      "text-[var(--error-text)] line-through",
                    ]
                  )}
                />

                {/* Show correct answer for incorrect responses */}
                {answered && state === "incorrect" && (
                  <span className="absolute -bottom-6 left-0 right-0 text-xs text-center text-[var(--success-text)] font-medium">
                    {correctAnswer}
                  </span>
                )}

                {/* Checkmark for correct */}
                {answered && state === "correct" && (
                  <span className="absolute -right-6 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-[var(--success-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
        <p className="text-sm text-[var(--text-muted)] text-center">
          Fill in {blankCount} blank{blankCount > 1 ? "s" : ""} to complete the statement
        </p>
      )}

      {/* Submit button */}
      {!answered && (
        <button
          onClick={handleSubmit}
          disabled={!allFilled}
          className={cn(
            "btn w-full py-4 text-base font-semibold rounded-xl transition-all duration-200",
            allFilled
              ? "btn-primary"
              : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
          )}
        >
          {allFilled
            ? "Check Answers"
            : `Fill all blanks (${answers.filter((a) => a.trim()).length}/${blankCount})`}
        </button>
      )}
    </div>
  );
}
