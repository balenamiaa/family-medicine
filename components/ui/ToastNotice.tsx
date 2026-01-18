"use client";

import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "info" | "success" | "warning";

interface ToastNoticeProps {
  title: string;
  message?: string;
  tone?: ToastTone;
  onDismiss?: () => void;
  className?: string;
}

export function ToastNotice({
  title,
  message,
  tone = "info",
  onDismiss,
  className,
}: ToastNoticeProps) {
  const toneStyles: Record<ToastTone, string> = {
    info: "border-[var(--border-accent)]/60 bg-[var(--bg-card)]",
    success: "border-[var(--success-border)]/60 bg-[var(--bg-card)]",
    warning: "border-[var(--warning-border)]/60 bg-[var(--bg-card)]",
  };

  const iconStyles: Record<ToastTone, string> = {
    info: "bg-[var(--bg-accent-subtle)] text-[var(--text-accent)]",
    success: "bg-[var(--success-bg)] text-[var(--success-text)]",
    warning: "bg-[var(--warning-bg)] text-[var(--warning-text)]",
  };

  const Icon = tone === "success" ? CheckCircle : tone === "warning" ? AlertTriangle : Info;

  return (
    <div className={cn("fixed bottom-6 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-[360px]", className)}>
      <div
        className={cn(
          "card border p-4 shadow-lg animate-slide-in",
          toneStyles[tone]
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex h-9 w-9 items-center justify-center rounded-full",
              iconStyles[tone]
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {title}
            </p>
            {message && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {message}
              </p>
            )}
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
