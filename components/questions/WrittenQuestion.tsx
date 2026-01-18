"use client";

import { useEffect, useState } from "react";
import { WrittenQuestion as WrittenQuestionType } from "@/types";
import { cn } from "@/lib/utils";

interface WrittenQuestionProps {
  question: WrittenQuestionType;
  onAnswer: (correct: boolean, answer: string) => void;
  answered: boolean;
}

export function WrittenQuestion({ question, onAnswer, answered }: WrittenQuestionProps) {
  const [response, setResponse] = useState("");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!answered) {
      setResponse("");
      setRevealed(false);
    }
  }, [answered, question.id, question.question_text]);

  const canEvaluate = revealed && !answered;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-lg leading-relaxed text-[var(--text-primary)]">
          {question.question_text}
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Write your response, then reveal the model answer to self-check.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Your response
        </label>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Type your answer here..."
          rows={6}
          disabled={answered}
          className={cn(
            "w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all resize-none",
            answered && "opacity-75"
          )}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setRevealed(true)}
          disabled={revealed}
          className={cn(
            "btn btn-ghost",
            revealed && "opacity-60 cursor-not-allowed"
          )}
        >
          Reveal Model Answer
        </button>
        {canEvaluate && (
          <>
            <button
              type="button"
              onClick={() => onAnswer(true, response)}
              className="btn btn-primary"
            >
              I was correct
            </button>
            <button
              type="button"
              onClick={() => onAnswer(false, response)}
              className="btn btn-ghost"
            >
              I missed it
            </button>
          </>
        )}
      </div>

      {(revealed || answered) && (
        <div className="card p-4 border-[var(--border-subtle)]">
          <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Model Answer
          </div>
          <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
            {question.correct_answer}
          </div>
        </div>
      )}
    </div>
  );
}
