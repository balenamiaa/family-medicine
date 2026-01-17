"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Login failed. Please try again.");
      }

      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 bg-[var(--bg-primary)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 right-0 w-[320px] h-[320px] rounded-full bg-[var(--bg-accent)]/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] rounded-full bg-[var(--success-bg)]/40 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="card p-8 shadow-[var(--shadow-xl)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-teal-500)] to-[var(--color-teal-700)] flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
                Welcome back
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Sign in to continue your study streak.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20"
                required
              />
            </label>

            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Name (optional)
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Preferred display name"
                className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-[var(--error-border)] bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error-text)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full rounded-xl bg-[var(--bg-accent)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-all",
                "hover:opacity-90 active:scale-[0.98]",
                isSubmitting && "opacity-60 cursor-not-allowed"
              )}
            >
              Continue
            </button>
          </form>

          <p className="mt-6 text-xs text-[var(--text-muted)]">
            Admin access appears in Settings for approved accounts.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
