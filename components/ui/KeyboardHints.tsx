"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface KeyboardHintsProps {
  className?: string;
  compact?: boolean;
}

export function KeyboardHints({ className, compact = false }: KeyboardHintsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed hints before
    const dismissed = localStorage.getItem("medcram_hints_dismissed");
    if (!dismissed) {
      // Show hints instantly - no artificial delays
      setIsVisible(true);
    }
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem("medcram_hints_dismissed", "true");
  };

  if (!isVisible) return null;

  if (compact) {
    return (
      <div className={cn("text-xs text-[var(--text-muted)] flex items-center gap-3 flex-wrap", className)}>
        <span>
          <kbd className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded text-[10px]">1-5</kbd> Select
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded text-[10px]">Enter</kbd> Submit
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded text-[10px]">←→</kbd> Navigate
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded text-[10px]">B</kbd> Bookmark
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded text-[10px]">R</kbd> Retry
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "card p-4 bg-[var(--bg-accent-subtle)] border-[var(--border-accent)] animate-fade-in",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[var(--text-accent)] mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Keyboard Shortcuts
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded text-xs font-mono">
                1-5
              </kbd>
              <span className="text-[var(--text-secondary)]">Select option</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded text-xs font-mono">
                Enter
              </kbd>
              <span className="text-[var(--text-secondary)]">Submit</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded text-xs font-mono">
                ← →
              </kbd>
              <span className="text-[var(--text-secondary)]">Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded text-xs font-mono">
                B
              </kbd>
              <span className="text-[var(--text-secondary)]">Bookmark</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded text-xs font-mono">
                R
              </kbd>
              <span className="text-[var(--text-secondary)]">Retry</span>
            </div>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
