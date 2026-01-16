"use client";

import Link from "next/link";
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
  href,
  className,
}: StudySetCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] line-clamp-1">
          {title}
        </h3>
        <StudySetTypeBadge type={type} />
      </div>

      {description && (
        <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-4">
          {description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>{cardCount} cards</span>
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
