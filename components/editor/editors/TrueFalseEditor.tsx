"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TrueFalseData {
  statement: string;
  correct_answer: boolean;
  explanation: string;
  retention_aid: string;
}

interface TrueFalseEditorProps {
  data: TrueFalseData | null;
  onChange: (data: TrueFalseData) => void;
}

export function TrueFalseEditor({ data, onChange }: TrueFalseEditorProps) {
  const [statement, setStatement] = useState(data?.statement ?? "");
  const [correctAnswer, setCorrectAnswer] = useState(data?.correct_answer ?? true);
  const [explanation, setExplanation] = useState(data?.explanation ?? "");
  const [retentionAid, setRetentionAid] = useState(data?.retention_aid ?? "");

  // Sync changes
  useEffect(() => {
    onChange({
      statement,
      correct_answer: correctAnswer,
      explanation,
      retention_aid: retentionAid,
    });
  }, [statement, correctAnswer, explanation, retentionAid]);

  return (
    <div className="space-y-6">
      {/* Statement */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Statement <span className="text-[var(--error-text)]">*</span>
        </label>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="Enter a statement that is either true or false..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all resize-none"
        />
      </div>

      {/* Correct answer */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
          Correct Answer <span className="text-[var(--error-text)]">*</span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCorrectAnswer(true)}
            className={cn(
              "flex-1 py-4 rounded-xl border-2 font-medium transition-all",
              correctAnswer
                ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              True
            </div>
          </button>
          <button
            type="button"
            onClick={() => setCorrectAnswer(false)}
            className={cn(
              "flex-1 py-4 rounded-xl border-2 font-medium transition-all",
              !correctAnswer
                ? "border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              False
            </div>
          </button>
        </div>
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Explanation
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain why this statement is true or false..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all resize-none"
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">Supports Markdown formatting</p>
      </div>

      {/* Retention aid */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Memory Trick
        </label>
        <textarea
          value={retentionAid}
          onChange={(e) => setRetentionAid(e.target.value)}
          placeholder="Add a mnemonic or memory trick..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all resize-none"
        />
      </div>
    </div>
  );
}
