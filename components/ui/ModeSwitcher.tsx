"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Mode {
  name: string;
  path: string;
  icon: React.ReactNode;
  description: string;
}

const modes: Mode[] = [
  {
    name: "Library",
    path: "/",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h6m-6 5h6m-6 5h6M15 7h6m-6 5h6m-6 5h6" />
      </svg>
    ),
    description: "Browse study sets",
  },
  {
    name: "Practice",
    path: "/practice",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    description: "Study at your own pace",
  },
  {
    name: "Review",
    path: "/review",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    description: "Spaced repetition review",
  },
  {
    name: "Exam",
    path: "/exam",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: "Timed exam simulation",
  },
  {
    name: "Bookmarks",
    path: "/bookmarks",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
    description: "Saved questions",
  },
  {
    name: "Stats",
    path: "/stats",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    description: "Study statistics",
  },
];

export function ModeSwitcher() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-0.5 sm:gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
      {modes.map((mode) => {
        const isActive = pathname === mode.path;

        return (
          <Link
            key={mode.path}
            href={mode.path}
            className={cn(
              // Base styles with larger mobile touch targets (min 44px)
              "relative flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
              // Mobile: icon-only with minimum 44px touch target
              "min-w-[44px] min-h-[44px] p-2.5",
              // Desktop: show text with adjusted padding
              "sm:min-w-0 sm:px-4 sm:py-2.5 text-sm",
              isActive
                ? "bg-[var(--bg-accent)] text-[var(--text-inverse)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
            )}
            title={mode.description}
          >
            {mode.icon}
            <span className="hidden sm:inline">{mode.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
