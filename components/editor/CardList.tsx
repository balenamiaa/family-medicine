"use client";

import { cn } from "@/lib/utils";
import { QuestionType, QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, Difficulty } from "@/types";

interface Card {
  id: string;
  questionType: QuestionType;
  questionData: any;
  difficulty: Difficulty;
  orderIndex: number;
}

interface CardListProps {
  cards: Card[];
  selectedCardId: string | null;
  onSelect: (cardId: string) => void;
  onDelete: (cardId: string) => void;
  onDuplicate: (cardId: string) => void;
  onReorder: (cardId: string, direction: "up" | "down") => void;
  className?: string;
}

function getCardPreviewText(card: Card): string {
  const data = card.questionData;
  if (!data) return "Empty card";

  switch (card.questionType) {
    case "mcq_single":
    case "mcq_multi":
      return data.question_text || "No question text";
    case "true_false":
      return data.statement || "No statement";
    case "emq":
      return data.theme || "No theme";
    case "cloze":
      return data.text?.substring(0, 50) || "No text";
    case "written":
      return data.question_text || "No prompt";
    default:
      return "Card";
  }
}

export function CardList({
  cards,
  selectedCardId,
  onSelect,
  onDelete,
  onDuplicate,
  onReorder,
  className,
}: CardListProps) {
  if (cards.length === 0) {
    return (
      <div className={cn("text-center py-8 text-[var(--text-muted)]", className)}>
        No cards yet. Create your first card to get started.
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {cards.map((card, index) => (
        <div
          key={card.id}
          onClick={() => onSelect(card.id)}
          className={cn(
            "group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
            selectedCardId === card.id
              ? "border-[var(--border-accent)] bg-[var(--bg-accent-subtle)]"
              : "border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--bg-secondary)]"
          )}
        >
          {/* Order controls */}
          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReorder(card.id, "up");
              }}
              disabled={index === 0}
              className={cn(
                "p-1 rounded hover:bg-[var(--bg-card-hover)] transition-colors",
                index === 0 && "opacity-30 cursor-not-allowed"
              )}
            >
              <svg className="w-3 h-3 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReorder(card.id, "down");
              }}
              disabled={index === cards.length - 1}
              className={cn(
                "p-1 rounded hover:bg-[var(--bg-card-hover)] transition-colors",
                index === cards.length - 1 && "opacity-30 cursor-not-allowed"
              )}
            >
              <svg className="w-3 h-3 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Card number */}
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-sm font-medium text-[var(--text-secondary)]">
            {index + 1}
          </div>

          {/* Card info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                {QUESTION_TYPE_LABELS[card.questionType]}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {DIFFICULTY_LABELS[card.difficulty]}
              </span>
            </div>
            <p className="text-sm text-[var(--text-primary)] truncate">
              {getCardPreviewText(card)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(card.id);
              }}
              className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
              title="Duplicate"
            >
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              className="p-2 rounded-lg hover:bg-[var(--error-bg)] transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4 text-[var(--error-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
