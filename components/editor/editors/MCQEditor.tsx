"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MCQData {
  question_text: string;
  options: string[];
  correct_answer: number | number[];
  explanation: string;
  retention_aid: string;
}

interface MCQEditorProps {
  data: MCQData | null;
  isMulti: boolean;
  onChange: (data: MCQData) => void;
}

export function MCQEditor({ data, isMulti, onChange }: MCQEditorProps) {
  const [questionText, setQuestionText] = useState(data?.question_text ?? "");
  const [options, setOptions] = useState<string[]>(data?.options ?? ["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<number | number[]>(
    data?.correct_answer ?? (isMulti ? [] : 0)
  );
  const [explanation, setExplanation] = useState(data?.explanation ?? "");
  const [retentionAid, setRetentionAid] = useState(data?.retention_aid ?? "");

  // Sync changes
  useEffect(() => {
    onChange({
      question_text: questionText,
      options,
      correct_answer: correctAnswer,
      explanation,
      retention_aid: retentionAid,
    });
  }, [questionText, options, correctAnswer, explanation, retentionAid]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);

    // Adjust correct answer(s)
    if (isMulti) {
      const newCorrect = (correctAnswer as number[])
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i));
      setCorrectAnswer(newCorrect);
    } else {
      const current = correctAnswer as number;
      if (current === index) {
        setCorrectAnswer(0);
      } else if (current > index) {
        setCorrectAnswer(current - 1);
      }
    }
  };

  const toggleCorrectAnswer = (index: number) => {
    if (isMulti) {
      const current = correctAnswer as number[];
      if (current.includes(index)) {
        setCorrectAnswer(current.filter((i) => i !== index));
      } else {
        setCorrectAnswer([...current, index].sort());
      }
    } else {
      setCorrectAnswer(index);
    }
  };

  const isCorrect = (index: number) => {
    if (isMulti) {
      return (correctAnswer as number[]).includes(index);
    }
    return correctAnswer === index;
  };

  return (
    <div className="space-y-6">
      {/* Question text */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Question <span className="text-[var(--error-text)]">*</span>
        </label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter your question..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all resize-none"
        />
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Options <span className="text-[var(--error-text)]">*</span>
          <span className="ml-2 text-xs text-[var(--text-muted)] font-normal">
            (Click to mark as correct)
          </span>
        </label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleCorrectAnswer(index)}
                className={cn(
                  "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                  isCorrect(index)
                    ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]"
                    : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                )}
              >
                {isCorrect(index) && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="p-2 rounded-lg hover:bg-[var(--error-bg)] transition-colors"
                >
                  <svg className="w-4 h-4 text-[var(--error-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="mt-3 text-sm text-[var(--text-accent)] hover:underline"
        >
          + Add Option
        </button>
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Explanation
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain why this is the correct answer..."
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
