"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface EMQData {
  theme: string;
  instructions: string;
  options: string[];
  premises: string[];
  correct_answers: number[];
  explanation: string;
  retention_aid: string;
}

interface EMQEditorProps {
  data: EMQData | null;
  onChange: (data: EMQData) => void;
}

export function EMQEditor({ data, onChange }: EMQEditorProps) {
  const [theme, setTheme] = useState(data?.theme ?? "");
  const [instructions, setInstructions] = useState(data?.instructions ?? "For each premise, select the most appropriate option.");
  const [options, setOptions] = useState<string[]>(data?.options ?? ["", "", "", "", ""]);
  const [premises, setPremises] = useState<string[]>(data?.premises ?? [""]);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>(data?.correct_answers ?? [0]);
  const [explanation, setExplanation] = useState(data?.explanation ?? "");
  const [retentionAid, setRetentionAid] = useState(data?.retention_aid ?? "");

  // Sync changes
  useEffect(() => {
    onChange({
      theme,
      instructions,
      options,
      premises,
      correct_answers: correctAnswers,
      explanation,
      retention_aid: retentionAid,
    });
  }, [theme, instructions, options, premises, correctAnswers, explanation, retentionAid]);

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
    // Adjust correct answers
    setCorrectAnswers(correctAnswers.map(a => a >= index ? Math.max(0, a - 1) : a));
  };

  const handlePremiseChange = (index: number, value: string) => {
    const newPremises = [...premises];
    newPremises[index] = value;
    setPremises(newPremises);
  };

  const addPremise = () => {
    setPremises([...premises, ""]);
    setCorrectAnswers([...correctAnswers, 0]);
  };

  const removePremise = (index: number) => {
    if (premises.length <= 1) return;
    setPremises(premises.filter((_, i) => i !== index));
    setCorrectAnswers(correctAnswers.filter((_, i) => i !== index));
  };

  const handleCorrectAnswerChange = (premiseIndex: number, optionIndex: number) => {
    const newCorrectAnswers = [...correctAnswers];
    newCorrectAnswers[premiseIndex] = optionIndex;
    setCorrectAnswers(newCorrectAnswers);
  };

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Theme <span className="text-[var(--error-text)]">*</span>
        </label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g., Childhood Infections"
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all"
        />
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Instructions
        </label>
        <input
          type="text"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Instructions for the student..."
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all"
        />
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Options <span className="text-[var(--error-text)]">*</span>
        </label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-sm font-medium text-[var(--text-muted)]">
                {String.fromCharCode(65 + index)}
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
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

      {/* Premises */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Premises <span className="text-[var(--error-text)]">*</span>
          <span className="ml-2 text-xs text-[var(--text-muted)] font-normal">
            (Select correct option for each)
          </span>
        </label>
        <div className="space-y-4">
          {premises.map((premise, premiseIndex) => (
            <div key={premiseIndex} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
              <div className="flex items-start gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[var(--bg-accent-subtle)] flex items-center justify-center text-xs font-medium text-[var(--text-accent)]">
                  {premiseIndex + 1}
                </span>
                <textarea
                  value={premise}
                  onChange={(e) => handlePremiseChange(premiseIndex, e.target.value)}
                  placeholder="Enter the premise..."
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] transition-all resize-none text-sm"
                />
                {premises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePremise(premiseIndex)}
                    className="p-1.5 rounded-lg hover:bg-[var(--error-bg)] transition-colors"
                  >
                    <svg className="w-4 h-4 text-[var(--error-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 ml-8">
                {options.map((option, optionIndex) => (
                  option && (
                    <button
                      key={optionIndex}
                      type="button"
                      onClick={() => handleCorrectAnswerChange(premiseIndex, optionIndex)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        correctAnswers[premiseIndex] === optionIndex
                          ? "bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)]"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                      )}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </button>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addPremise}
          className="mt-3 text-sm text-[var(--text-accent)] hover:underline"
        >
          + Add Premise
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
          placeholder="Explain the correct matches..."
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
