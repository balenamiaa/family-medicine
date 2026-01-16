"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SidebarLink {
  name: string;
  href: string;
  icon: ReactNode;
  badge?: string | number;
  pattern?: RegExp;
}

export interface SidebarSection {
  title?: string;
  links: SidebarLink[];
}

interface SidebarProps {
  sections: SidebarSection[];
  footer?: ReactNode;
  className?: string;
}

export function Sidebar({ sections, footer, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col h-full p-4", className)}>
      <div className="flex-1 space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.links.map((link) => {
                const isActive = link.pattern
                  ? link.pattern.test(pathname)
                  : pathname === link.href;

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-[var(--bg-accent-subtle)] text-[var(--text-accent)] shadow-sm"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                      )}
                    >
                      <span className={cn(
                        "flex-shrink-0",
                        isActive ? "text-[var(--text-accent)]" : "text-[var(--text-muted)]"
                      )}>
                        {link.icon}
                      </span>
                      <span className="flex-1">{link.name}</span>
                      {link.badge !== undefined && (
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded-full font-medium",
                          isActive
                            ? "bg-[var(--text-accent)]/20 text-[var(--text-accent)]"
                            : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                        )}>
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {footer && (
        <div className="pt-4 border-t border-[var(--border-subtle)]">
          {footer}
        </div>
      )}
    </nav>
  );
}
