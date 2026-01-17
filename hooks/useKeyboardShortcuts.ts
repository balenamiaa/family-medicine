"use client";

import { useEffect, useCallback, useRef } from "react";
import { playSoundIfEnabled } from "@/lib/sounds";
import { Quality } from "@/lib/spacedRepetition";

interface KeyboardShortcutsConfig {
  onSelectOption?: (index: number) => void;
  onSubmit?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onToggleBookmark?: () => void;
  onReset?: () => void;
  onFeedback?: (quality: Quality) => void;
  optionCount?: number;
  isAnswered?: boolean;
  canSubmit?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  feedbackEnabled?: boolean;
  feedbackOptions?: number;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onSelectOption,
  onSubmit,
  onNext,
  onPrevious,
  onToggleBookmark,
  onReset,
  onFeedback,
  optionCount = 0,
  isAnswered = false,
  canSubmit = false,
  canGoNext = false,
  canGoPrevious = false,
  feedbackEnabled = false,
  feedbackOptions = 0,
  enabled = true,
}: KeyboardShortcutsConfig): void {
  // Use refs to always have latest values in event handler
  const configRef = useRef({
    onSelectOption,
    onSubmit,
    onNext,
    onPrevious,
    onToggleBookmark,
    onReset,
    onFeedback,
    optionCount,
    isAnswered,
    canSubmit,
    canGoNext,
    canGoPrevious,
    feedbackEnabled,
    feedbackOptions,
    enabled,
  });

  // Update refs when props change
  useEffect(() => {
    configRef.current = {
      onSelectOption,
      onSubmit,
      onNext,
      onPrevious,
      onToggleBookmark,
      onReset,
      onFeedback,
      optionCount,
      isAnswered,
      canSubmit,
      canGoNext,
      canGoPrevious,
      feedbackEnabled,
      feedbackOptions,
      enabled,
    };
  }, [
    onSelectOption,
    onSubmit,
    onNext,
    onPrevious,
    onToggleBookmark,
    onReset,
    onFeedback,
    optionCount,
    isAnswered,
    canSubmit,
    canGoNext,
    canGoPrevious,
    feedbackEnabled,
    feedbackOptions,
    enabled,
  ]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const config = configRef.current;

    if (!config.enabled) return;

    // Don't handle if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    // Number keys 1-9 for selecting options
    if (!config.isAnswered && config.onSelectOption) {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= Math.min(9, config.optionCount)) {
        e.preventDefault();
        playSoundIfEnabled("click");
        config.onSelectOption(num - 1);
        return;
      }
    }

    // Number keys for post-answer feedback
    if (config.isAnswered && config.feedbackEnabled && config.onFeedback) {
      const num = parseInt(e.key, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= config.feedbackOptions) {
        e.preventDefault();
        playSoundIfEnabled("click");
        config.onFeedback((num - 1) as Quality);
        return;
      }
    }

    // Enter to submit (only before answering - after answering, use arrow keys to navigate)
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      if (!config.isAnswered && config.canSubmit && config.onSubmit) {
        e.preventDefault();
        playSoundIfEnabled("click");
        config.onSubmit();
      }
      // Don't auto-advance on Enter after answering - let user read the explanation
      return;
    }

    // Arrow keys for navigation (works regardless of answer state)
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      if (config.canGoNext && config.onNext) {
        e.preventDefault();
        playSoundIfEnabled("navigate");
        config.onNext();
      }
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      if (config.canGoPrevious && config.onPrevious) {
        e.preventDefault();
        playSoundIfEnabled("navigate");
        config.onPrevious();
      }
      return;
    }

    // B to toggle bookmark
    if (e.key === "b" || e.key === "B") {
      if (config.onToggleBookmark) {
        e.preventDefault();
        playSoundIfEnabled("click");
        config.onToggleBookmark();
      }
      return;
    }

    // R to reset after answering
    if ((e.key === "r" || e.key === "R") && config.isAnswered) {
      if (config.onReset) {
        e.preventDefault();
        playSoundIfEnabled("click");
        config.onReset();
      }
      return;
    }

    // T/F for true/false questions
    if (!config.isAnswered && config.optionCount === 2 && config.onSelectOption) {
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        playSoundIfEnabled("click");
        config.onSelectOption(0); // True is first
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        playSoundIfEnabled("click");
        config.onSelectOption(1); // False is second
        return;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Hook for showing keyboard hints
export function useKeyboardHintsVisible(): boolean {
  // Could track if user has used keyboard recently
  return true;
}
