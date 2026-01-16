"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { JsonImporter } from "@/components/sets";

interface StudySet {
  id: string;
  title: string;
  cardCount: number;
  _permissions: {
    canEdit: boolean;
  };
}

export default function ImportPage() {
  const params = useParams();
  const router = useRouter();
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudySet();
  }, [params.id]);

  const fetchStudySet = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/study-sets/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch study set");
      const data = await response.json();
      setStudySet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportComplete = (count: number) => {
    // Redirect to cards page after short delay to show success message
    setTimeout(() => {
      router.push(`/sets/${params.id}/cards`);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-[var(--bg-secondary)] rounded" />
          <div className="h-64 bg-[var(--bg-secondary)] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !studySet) {
    return (
      <div className="p-6 lg:p-8">
        <div className="card p-12 text-center">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {error || "Study set not found"}
          </h2>
          <Link href="/sets" className="btn btn-primary mt-4">
            Back to Sets
          </Link>
        </div>
      </div>
    );
  }

  if (!studySet._permissions.canEdit) {
    return (
      <div className="p-6 lg:p-8">
        <div className="card p-12 text-center">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            You don&apos;t have permission to edit this study set
          </h2>
          <Link href={`/sets/${params.id}`} className="btn btn-primary mt-4">
            Back to Set
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/sets" className="hover:text-[var(--text-primary)] transition-colors">
          My Study Sets
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link
          href={`/sets/${params.id}`}
          className="hover:text-[var(--text-primary)] transition-colors truncate max-w-[200px]"
        >
          {studySet.title}
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[var(--text-primary)]">Import Questions</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
            Import Questions
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Import questions from JSON into &quot;{studySet.title}&quot;
            {studySet.cardCount > 0 && ` (currently ${studySet.cardCount} cards)`}
          </p>
        </div>
        <Link href={`/sets/${params.id}/cards`} className="btn btn-ghost">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back to Editor
        </Link>
      </div>

      {/* Importer */}
      <div className="card p-6">
        <JsonImporter
          studySetId={params.id as string}
          onImportComplete={handleImportComplete}
          onClose={() => router.push(`/sets/${params.id}/cards`)}
        />
      </div>
    </div>
  );
}
