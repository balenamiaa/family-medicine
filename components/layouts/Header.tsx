"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ThemeToggle, SoundToggle } from "@/components/ui";
import { CategoryNav } from "./CategoryNav";
import { cn } from "@/lib/utils";

interface HeaderProps {
  /** Optional center content (e.g., ModeSwitcher for Learn pages) */
  centerContent?: ReactNode;
  /** Optional right content (replaces default toggles) */
  rightContent?: ReactNode;
  /** Whether to show category navigation */
  showCategoryNav?: boolean;
  className?: string;
}

export function Header({
  centerContent,
  rightContent,
  showCategoryNav = true,
  className,
}: HeaderProps) {
  return (
    <div className={cn("px-4 md:px-6 h-16 flex items-center justify-between gap-4", className)}>
      {/* Left: Logo and Category Nav */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-[var(--text-primary)] hover:text-[var(--text-accent)] transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-teal-500)] to-[var(--color-teal-600)] dark:from-[var(--color-amber-400)] dark:to-[var(--color-amber-500)] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-display text-lg font-semibold hidden sm:inline">MedCram</span>
        </Link>

        {showCategoryNav && (
          <div className="hidden md:block">
            <CategoryNav />
          </div>
        )}
      </div>

      {/* Center: Optional content */}
      {centerContent && (
        <div className="flex-1 flex justify-center">
          {centerContent}
        </div>
      )}

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {rightContent || (
          <>
            <SoundToggle />
            <ThemeToggle />
            <Link
              href="/settings"
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
