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
    name: "Practice",
    path: "/",
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
];

export function ModeSwitcher() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
      {modes.map((mode) => {
        const isActive = pathname === mode.path;

        return (
          <Link
            key={mode.path}
            href={mode.path}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
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
