"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { QuestionType, QUESTION_TYPE_LABELS } from "@/types";

interface CardTypeSelectorProps {
  selectedType: QuestionType | null;
  onSelect: (type: QuestionType) => void;
  className?: string;
}

const typeIcons: Record<QuestionType, ReactNode> = {
  mcq_single: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  ),
  mcq_multi: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  ),
  true_false: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  emq: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6v12" />
    </svg>
  ),
  cloze: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
      <rect x="14" y="10" width="6" height="4" rx="1" strokeDasharray="2 2" />
    </svg>
  ),
};

const typeDescriptions: Record<QuestionType, string> = {
  mcq_single: "Single correct answer from multiple options",
  mcq_multi: "Multiple correct answers from options",
  true_false: "Statement is either true or false",
  emq: "Match premises to options from a theme",
  cloze: "Fill in the blanks in text",
};

export function CardTypeSelector({ selectedType, onSelect, className }: CardTypeSelectorProps) {
  const types: QuestionType[] = ["mcq_single", "mcq_multi", "true_false", "emq", "cloze"];

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {types.map((type) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={cn(
            "p-4 rounded-xl border-2 text-left transition-all group",
            selectedType === type
              ? "border-[var(--border-accent)] bg-[var(--bg-accent-subtle)]"
              : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
            selectedType === type
              ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] group-hover:bg-[var(--bg-card-hover)]"
          )}>
            {typeIcons[type]}
          </div>
          <div className="font-medium text-[var(--text-primary)]">
            {QUESTION_TYPE_LABELS[type]}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {typeDescriptions[type]}
          </div>
        </button>
      ))}
    </div>
  );
}
