"use client";

import { cn } from "@/lib/utils";

type StudySetType = "SYSTEM" | "PUBLIC" | "PRIVATE";

interface StudySetTypeBadgeProps {
  type: StudySetType;
  size?: "sm" | "md";
}

const typeConfig: Record<StudySetType, { label: string; className: string }> = {
  SYSTEM: {
    label: "System",
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
  PUBLIC: {
    label: "Public",
    className: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  },
  PRIVATE: {
    label: "Private",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
};

export function StudySetTypeBadge({ type, size = "sm" }: StudySetTypeBadgeProps) {
  const config = typeConfig[type];

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
