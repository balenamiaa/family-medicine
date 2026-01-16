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
          </>
        )}
      </div>
    </div>
  );
}
