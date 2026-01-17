"use client";

import { useEffect, useState } from "react";

interface WrittenData {
  question_text: string;
  correct_answer: string;
  explanation: string;
  retention_aid: string;
}

interface WrittenEditorProps {
  data: WrittenData | null;
  onChange: (data: WrittenData) => void;
}

export function WrittenEditor({ data, onChange }: WrittenEditorProps) {
  const [questionText, setQuestionText] = useState(data?.question_text ?? "");
  const [correctAnswer, setCorrectAnswer] = useState(data?.correct_answer ?? "");
  const [explanation, setExplanation] = useState(data?.explanation ?? "");
  const [retentionAid, setRetentionAid] = useState(data?.retention_aid ?? "");

  useEffect(() => {
    onChange({
      question_text: questionText,
      correct_answer: correctAnswer,
      explanation,
      retention_aid: retentionAid,
    });
  }, [questionText, correctAnswer, explanation, retentionAid, onChange]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Prompt <span className="text-[var(--error-text)]">*</span>
        </label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Write the prompt or question..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Model Answer <span className="text-[var(--error-text)]">*</span>
        </label>
        <textarea
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          placeholder="Provide the ideal answer for self-checking..."
          rows={5}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Explanation
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Add key reasoning or context..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all resize-none"
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">Supports Markdown formatting</p>
      </div>

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
