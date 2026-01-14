"use client";

import { useState, useEffect, useCallback } from "react";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";
import { playSoundIfEnabled } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  questionIndex: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  onToggle?: (bookmarked: boolean) => void;
}

export function BookmarkButton({
  questionIndex,
  className,
  size = "md",
  showLabel = false,
  onToggle,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setBookmarked(isBookmarked(questionIndex));
  }, [questionIndex]);

  const handleToggle = useCallback(() => {
    const newState = toggleBookmark(questionIndex);
    setBookmarked(newState);
    playSoundIfEnabled("click");
    onToggle?.(newState);
  }, [questionIndex, onToggle]);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  if (!mounted) {
    return (
      <button className={cn("btn btn-ghost p-2 rounded-lg", className)} aria-label="Bookmark">
        <div className={sizeClasses[size]} />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "btn btn-ghost p-2 rounded-lg transition-all duration-200 group",
        bookmarked && "text-[var(--warning-text)] bg-[var(--warning-bg)]",
        className
      )}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      title={`${bookmarked ? "Remove from" : "Add to"} bookmarks (B)`}
    >
      {bookmarked ? (
        <svg
          className={cn(sizeClasses[size], "fill-current")}
          viewBox="0 0 24 24"
        >
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ) : (
        <svg
          className={cn(sizeClasses[size], "group-hover:scale-110 transition-transform")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      )}
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {bookmarked ? "Bookmarked" : "Bookmark"}
        </span>
      )}
    </button>
  );
}
