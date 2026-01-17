"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ThemeToggle, SoundToggle } from "@/components/ui";
import { useStudySet } from "@/components/sets";
import { cn } from "@/lib/utils";
import { clearStats } from "@/lib/stats";
import { clearAllBookmarks } from "@/lib/bookmarks";
import { clearAllData as clearSRData } from "@/lib/spacedRepetition";
import { scopedKey } from "@/lib/storage";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  role: "ADMIN" | "USER";
}

export default function SettingsPage() {
  const { activeSet } = useStudySet();
  const statsKey = scopedKey("medcram_study_stats", activeSet?.id);
  const bookmarkKey = scopedKey("medcram_bookmarks", activeSet?.id);
  const srKey = scopedKey("medcram_spaced_repetition", activeSet?.id);

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState<string | null>(null);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  const isAdmin = user?.role === "ADMIN";

  const handleClearData = (type: string) => {
    switch (type) {
      case "stats":
        clearStats(statsKey);
        break;
      case "bookmarks":
        clearAllBookmarks(bookmarkKey);
        break;
      case "progress":
        clearSRData(srKey);
        [
          "medcram_practice_progress",
          "medcram_review_progress",
          "medcram_bookmarks_progress",
          "medcram_exam_progress",
        ].forEach((key) => localStorage.removeItem(scopedKey(key, activeSet?.id)));
        break;
      case "all":
        clearStats(statsKey);
        clearAllBookmarks(bookmarkKey);
        clearSRData(srKey);
        localStorage.clear();
        break;
    }
    setShowClearConfirm(null);
    setClearSuccess(type);
    setTimeout(() => setClearSuccess(null), 3000);
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
            Settings
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Customize your learning experience
          </p>
        </div>

        {/* User Info */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            Account
          </h2>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-[var(--bg-secondary)] rounded w-1/3" />
              <div className="h-4 bg-[var(--bg-secondary)] rounded w-1/2" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--bg-accent)] to-[var(--success-border)] flex items-center justify-center text-white font-bold text-lg">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div className="font-medium text-[var(--text-primary)]">
                  {user.name || "Anonymous User"}
                </div>
                <div className="text-sm text-[var(--text-muted)]">
                  {user.email}
                </div>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[var(--bg-accent-subtle)] text-[var(--text-accent)] text-xs font-medium">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Administrator
                  </span>
                )}
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className={cn(
                    "mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors",
                    "hover:bg-[var(--bg-card-hover)]",
                    isSigningOut && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[var(--text-muted)]">Not signed in</p>
          )}
        </div>

        {/* Admin Access - Only visible to admins */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="card p-6 border-[var(--border-accent)]"
          >
            <h2 className="text-sm font-semibold text-[var(--text-accent)] uppercase tracking-wider mb-4">
              Administration
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Access the admin dashboard to manage users, study sets, and view analytics.
            </p>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-accent)] text-[var(--text-inverse)] font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open Admin Dashboard
            </Link>
          </motion.div>
        )}

        {/* Appearance */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            Appearance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[var(--text-primary)]">Theme</div>
                <div className="text-sm text-[var(--text-muted)]">Switch between light and dark mode</div>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[var(--text-primary)]">Sound Effects</div>
                <div className="text-sm text-[var(--text-muted)]">Play sounds for interactions</div>
              </div>
              <SoundToggle />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            Data Management
          </h2>
          <div className="space-y-3">
            {[
              { id: "stats", label: "Clear Statistics", desc: "Reset all study statistics" },
              { id: "bookmarks", label: "Clear Bookmarks", desc: "Remove all bookmarked questions" },
              { id: "progress", label: "Clear Progress", desc: "Reset spaced repetition progress" },
              { id: "all", label: "Clear All Data", desc: "Remove all local data", danger: true },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div>
                  <div className={cn(
                    "font-medium",
                    item.danger ? "text-[var(--error-text)]" : "text-[var(--text-primary)]"
                  )}>
                    {item.label}
                  </div>
                  <div className="text-sm text-[var(--text-muted)]">{item.desc}</div>
                </div>
                {showClearConfirm === item.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleClearData(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--error-bg)] text-[var(--error-text)] text-sm font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(null)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ) : clearSuccess === item.id ? (
                  <span className="text-sm text-[var(--success-text)]">Cleared ✓</span>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(item.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      item.danger
                        ? "bg-[var(--error-bg)] text-[var(--error-text)] hover:bg-[var(--error-border)] hover:text-white"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                    )}
                  >
                    Clear
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            About
          </h2>
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <p><strong>MedCram</strong> - Medical Exam Preparation</p>
            <p>Built with Next.js, React, and Tailwind CSS</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
