"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { StudySetTypeBadge } from "./StudySetTypeBadge";
import { cn } from "@/lib/utils";

type StudySetType = "SYSTEM" | "PUBLIC" | "PRIVATE";

interface StudySetCardProps {
  id: string;
  title: string;
  description?: string | null;
  type: StudySetType;
  cardCount: number;
  tags?: string[];
  creator?: {
    name?: string | null;
    email?: string | null;
  } | null;
  isSaved?: boolean;
  onToggleSave?: (id: string, nextSaved: boolean) => void;
  isSaveDisabled?: boolean;
  href?: string;
  className?: string;
}

export function StudySetCard({
  id,
  title,
  description,
  type,
  cardCount,
  tags = [],
  creator,
  isSaved = false,
  onToggleSave,
  isSaveDisabled = false,
  href,
  className,
}: StudySetCardProps) {
  const creatorLabel = creator?.name || creator?.email || null;
  const creatorInitial = creatorLabel?.[0]?.toUpperCase();
  const showSave = Boolean(onToggleSave);

  const handleToggleSave = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isSaveDisabled) return;
    onToggleSave?.(id, !isSaved);
  };

  const content = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] line-clamp-1">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {showSave && (
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={isSaveDisabled}
              aria-pressed={isSaved}
              aria-label={isSaved ? "Remove from library" : "Save to library"}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border transition-all",
                isSaved
                  ? "border-[var(--border-accent)] bg-[var(--bg-accent)] text-[var(--text-inverse)] shadow-sm"
                  : "border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)]",
                isSaveDisabled && "opacity-60 cursor-not-allowed"
              )}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}
          <StudySetTypeBadge type={type} />
        </div>
      </div>

      {description && (
        <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-4">
          {description}
        </p>
      )}

      <div className="mt-auto flex items-end justify-between gap-3">
        <div className="space-y-2">
          {creatorLabel && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[var(--bg-accent)] to-[var(--success-border)] text-[11px] font-semibold text-white">
                {creatorInitial ?? "U"}
              </span>
              <span className="truncate">by {creatorLabel}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>{cardCount} cards</span>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex gap-1 overflow-hidden">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded-full"
              >
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="px-2 py-0.5 text-xs text-[var(--text-muted)]">
                +{tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  const cardClassName = cn(
    "card p-5 flex flex-col h-full transition-all",
    href && "hover:border-[var(--border-accent)] hover:shadow-md cursor-pointer",
    className
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
