"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ExplanationPanelProps {
  explanation: string;
  isCorrect: boolean;
  isVisible: boolean;
}

export function ExplanationPanel({ explanation, isCorrect, isVisible }: ExplanationPanelProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden animate-scale-in",
        isCorrect
          ? "bg-[var(--success-bg)] border-[var(--success-border)]/40"
          : "bg-[var(--error-bg)] border-[var(--error-border)]/40"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-3 border-b",
          isCorrect
            ? "bg-[var(--success-border)]/10 border-[var(--success-border)]/20"
            : "bg-[var(--error-border)]/10 border-[var(--error-border)]/20"
        )}
      >
        {isCorrect ? (
          <>
            <div className="w-8 h-8 rounded-full bg-[var(--success-border)] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-semibold text-[var(--success-text)]">Correct!</span>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full bg-[var(--error-border)] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="font-semibold text-[var(--error-text)]">Not quite right</span>
          </>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <div className="prose text-[var(--text-secondary)] text-sm">
          <ReactMarkdown
            components={{
              h3: ({ children }) => (
                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] mt-4 first:mt-0 mb-2">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-[var(--text-secondary)]">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-[var(--text-accent)]">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-[var(--text-primary)]">{children}</em>
              ),
              code: ({ children }) => (
                <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-accent)]">
                  {children}
                </code>
              ),
            }}
          >
            {explanation}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
