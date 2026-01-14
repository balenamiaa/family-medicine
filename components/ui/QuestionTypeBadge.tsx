import { cn } from "@/lib/utils";
import { QuestionType, QUESTION_TYPE_LABELS } from "@/types";

interface QuestionTypeBadgeProps {
  type: QuestionType;
}

const typeIcons: Record<QuestionType, React.ReactNode> = {
  mcq_single: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  ),
  mcq_multi: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  true_false: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M5 12l5 5L20 7" />
    </svg>
  ),
  emq: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  cloze: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M4 6h16M4 12h8m-8 6h16" />
      <rect x="14" y="10" width="6" height="4" rx="1" strokeDasharray="2 2" />
    </svg>
  ),
};

export function QuestionTypeBadge({ type }: QuestionTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
        "bg-[var(--bg-accent-subtle)] text-[var(--text-accent)] border border-[var(--border-accent)]/30"
      )}
    >
      {typeIcons[type]}
      <span>{QUESTION_TYPE_LABELS[type]}</span>
    </span>
  );
}
