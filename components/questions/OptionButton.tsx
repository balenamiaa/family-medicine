"use client";

import { cn } from "@/lib/utils";
import { playSoundIfEnabled } from "@/lib/sounds";

interface OptionButtonProps {
  label: string;
  index: number;
  selected: boolean;
  correct?: boolean | null; // null = not revealed, true/false = revealed state
  disabled: boolean;
  multiSelect?: boolean;
  onClick: () => void;
}

const OPTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function OptionButton({
  label,
  index,
  selected,
  correct,
  disabled,
  multiSelect = false,
  onClick,
}: OptionButtonProps) {
  const letter = OPTION_LETTERS[index] ?? index.toString();
  const isRevealed = correct !== null && correct !== undefined;
  const isCorrectAnswer = correct === true;
  const isIncorrectSelection = selected && correct === false;
  const handleClick = () => {
    playSoundIfEnabled("select");
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "group relative w-full text-left rounded-xl border-2 transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-accent)] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",

        // Default state
        !isRevealed && !selected && [
          "bg-[var(--bg-card)] border-[var(--border-subtle)]",
          "hover:border-[var(--border-accent)] hover:bg-[var(--bg-card-hover)]",
        ],

        // Selected but not revealed
        !isRevealed && selected && [
          "bg-[var(--bg-accent-subtle)] border-[var(--border-accent)]",
        ],

        // Correct answer (revealed)
        isRevealed && isCorrectAnswer && [
          "bg-[var(--success-bg)] border-[var(--success-border)]",
        ],

        // Incorrect selection (revealed)
        isRevealed && isIncorrectSelection && [
          "bg-[var(--error-bg)] border-[var(--error-border)]",
        ],

        // Not selected, revealed, not correct
        isRevealed && !selected && !isCorrectAnswer && [
          "bg-[var(--bg-secondary)] border-[var(--border-subtle)] opacity-60",
        ]
      )}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Letter indicator */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
            "font-semibold text-sm transition-all duration-200",

            // Checkbox/Radio styling
            multiSelect ? "rounded-md" : "rounded-full",

            !isRevealed && !selected && [
              "bg-[var(--bg-secondary)] text-[var(--text-muted)]",
              "group-hover:bg-[var(--bg-accent)] group-hover:text-[var(--text-inverse)]",
            ],
            !isRevealed && selected && [
              "bg-[var(--bg-accent)] text-[var(--text-inverse)]",
            ],
            isRevealed && isCorrectAnswer && [
              "bg-[var(--success-border)] text-white",
            ],
            isRevealed && isIncorrectSelection && [
              "bg-[var(--error-border)] text-white",
            ],
            isRevealed && !selected && !isCorrectAnswer && [
              "bg-[var(--border-default)] text-[var(--text-muted)]",
            ]
          )}
        >
          {isRevealed && isCorrectAnswer ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : isRevealed && isIncorrectSelection ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            letter
          )}
        </div>

        {/* Label text */}
        <div className="flex-1 pt-2">
          <span
            className={cn(
              "text-base transition-colors duration-200",
              !isRevealed && "text-[var(--text-primary)]",
              isRevealed && isCorrectAnswer && "text-[var(--success-text)] font-medium",
              isRevealed && isIncorrectSelection && "text-[var(--error-text)]",
              isRevealed && !selected && !isCorrectAnswer && "text-[var(--text-muted)]"
            )}
          >
            {label}
          </span>
        </div>

        {/* Selection indicator for multi-select */}
        {multiSelect && selected && !isRevealed && (
          <div className="flex-shrink-0 pt-2">
            <svg className="w-5 h-5 text-[var(--text-accent)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}
