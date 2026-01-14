import { cn } from "@/lib/utils";
import { Difficulty, DIFFICULTY_LABELS } from "@/types";

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  size?: "sm" | "md";
}

export function DifficultyBadge({ difficulty, size = "md" }: DifficultyBadgeProps) {
  const label = DIFFICULTY_LABELS[difficulty];

  // Color based on difficulty level
  const colors: Record<Difficulty, string> = {
    1: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/30",
    2: "bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border-sky-500/30",
    3: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/30",
    4: "bg-orange-500/15 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/30",
    5: "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        colors[difficulty],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {/* Difficulty dots */}
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors",
              i < difficulty ? "bg-current" : "bg-current/20"
            )}
          />
        ))}
      </span>
      <span>{label}</span>
    </span>
  );
}
