"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
  sidebarPosition?: "left" | "right";
  className?: string;
}

/**
 * Base application shell with optional header and sidebar.
 * Provides consistent layout structure across all pages.
 */
export function AppShell({
  children,
  header,
  sidebar,
  sidebarPosition = "left",
  className,
}: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-[var(--bg-primary)]", className)}>
      {header && (
        <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-md">
          {header}
        </header>
      )}

      <div className="flex">
        {sidebar && sidebarPosition === "left" && (
          <aside className="hidden md:block w-64 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <div className="sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto">
              {sidebar}
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0">{children}</main>

        {sidebar && sidebarPosition === "right" && (
          <aside className="hidden lg:block w-72 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <div className="sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto p-4">
              {sidebar}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
