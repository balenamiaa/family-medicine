"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StudySetCard } from "@/components/sets";

interface StudySet {
  id: string;
  title: string;
  description: string | null;
  type: "SYSTEM" | "PUBLIC" | "PRIVATE";
  tags: string[];
  cardCount: number;
  createdAt: string;
}

export default function MySetsPage() {
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudySets();
  }, []);

  const fetchStudySets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/study-sets?owned=true");
      if (!response.ok) {
        throw new Error("Failed to fetch study sets");
      }
      const data = await response.json();
      setStudySets(data.studySets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
            My Study Sets
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Create and manage your personal study materials
          </p>
        </div>
        <Link href="/sets/new" className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create New
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="h-6 w-2/3 bg-[var(--bg-secondary)] rounded" />
                <div className="h-5 w-16 bg-[var(--bg-secondary)] rounded-full" />
              </div>
              <div className="h-4 w-full bg-[var(--bg-secondary)] rounded mb-2" />
              <div className="h-4 w-3/4 bg-[var(--bg-secondary)] rounded mb-4" />
              <div className="h-4 w-24 bg-[var(--bg-secondary)] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--error-bg)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--error-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-2">
            Failed to load study sets
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
          <button onClick={fetchStudySets} className="btn btn-primary">
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && studySets.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
            No study sets yet
          </h2>
          <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
            Create your first study set to start organizing your learning materials.
          </p>
          <Link href="/sets/new" className="btn btn-primary">
            Create Your First Set
          </Link>
        </div>
      )}

      {/* Study sets grid */}
      {!isLoading && !error && studySets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studySets.map((set) => (
            <StudySetCard
              key={set.id}
              id={set.id}
              title={set.title}
              description={set.description}
              type={set.type}
              cardCount={set.cardCount}
              tags={set.tags}
              href={`/sets/${set.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
