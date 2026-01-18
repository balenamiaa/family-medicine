"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, Pencil, Trash2 } from "lucide-react";
import { StudySetForm, StudySetTypeBadge } from "@/components/sets";
import { cn } from "@/lib/utils";

interface StudySet {
  id: string;
  title: string;
  description: string | null;
  type: "SYSTEM" | "PUBLIC" | "PRIVATE";
  tags: string[];
  cardCount: number;
  createdAt: string;
  updatedAt: string;
  _permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
}

export default function StudySetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudySet();
  }, [params.id]);

  const fetchStudySet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/study-sets/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Study set not found");
        }
        throw new Error("Failed to fetch study set");
      }
      const data = await response.json();
      setStudySet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: {
    title: string;
    description: string;
    type: "SYSTEM" | "PUBLIC" | "PRIVATE";
    tags: string[];
  }) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/study-sets/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update study set");
      }

      const updatedSet = await response.json();
      setStudySet(updatedSet);
      setIsEditing(false);
    } catch (error) {
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/study-sets/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete study set");
      }

      router.push("/sets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-48 bg-[var(--bg-secondary)] rounded" />
          <div className="h-8 w-64 bg-[var(--bg-secondary)] rounded" />
          <div className="card p-6 space-y-4">
            <div className="h-6 w-full bg-[var(--bg-secondary)] rounded" />
            <div className="h-6 w-3/4 bg-[var(--bg-secondary)] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !studySet) {
    return (
      <div className="p-6 lg:p-8">
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--error-bg)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--error-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-2">
            {error || "Study set not found"}
          </h2>
          <Link href="/sets" className="btn btn-primary mt-4">
            Back to My Sets
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
        <span className="text-[var(--text-primary)] truncate max-w-[200px]">{studySet.title}</span>
      </nav>

      {isEditing ? (
        <div className="max-w-2xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
              Edit Study Set
            </h1>
          </div>
          <div className="card p-6">
            <StudySetForm
              initialData={{
                title: studySet.title,
                description: studySet.description || "",
                type: studySet.type,
                tags: studySet.tags,
              }}
              allowedTypes={studySet.type === "SYSTEM" ? ["SYSTEM", "PUBLIC"] : ["PRIVATE", "PUBLIC"]}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              submitLabel="Save Changes"
              isLoading={isSaving}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {studySet.title}
                </h1>
                <StudySetTypeBadge type={studySet.type} size="md" />
              </div>
              {studySet.description && (
                <p className="text-[var(--text-muted)] max-w-2xl">
                  {studySet.description}
                </p>
              )}
            </div>
            {studySet._permissions.canEdit && (
              <div className="flex gap-2">
                <Link
                  href={`/sets/${studySet.id}/cards`}
                  className="btn btn-ghost"
                >
                  <LayoutGrid className="w-4 h-4" strokeWidth={2} />
                  Edit Cards
                </Link>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-ghost"
                >
                  <Pencil className="w-4 h-4" strokeWidth={2} />
                  Edit
                </button>
                {studySet._permissions.canDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn btn-ghost text-[var(--error-text)]"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="card p-5 border-[var(--error-border)] bg-[var(--error-bg)] mb-6 animate-scale-in">
              <p className="text-sm text-[var(--text-primary)] mb-4">
                Are you sure you want to delete this study set? This will also delete all {studySet.cardCount} cards. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={cn(
                    "btn bg-[var(--error-border)] text-white text-sm",
                    isDeleting && "opacity-50 cursor-not-allowed"
                  )}
                  aria-busy={isDeleting}
                >
                  <span className="flex items-center gap-2">
                    {isDeleting && (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    <span>Yes, Delete</span>
                  </span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="btn btn-ghost text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-accent-subtle)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--text-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                    {studySet.cardCount}
                  </div>
                  <div className="text-sm text-[var(--text-muted)]">Cards</div>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(studySet.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-[var(--text-muted)]">Created</div>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(studySet.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-[var(--text-muted)]">Updated</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {studySet.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {studySet.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href={`/sets/${studySet.id}/cards`}
              className="card p-5 hover:border-[var(--border-accent)] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-accent-subtle)] flex items-center justify-center group-hover:bg-[var(--bg-accent)] transition-colors">
                  <svg className="w-5 h-5 text-[var(--text-accent)] group-hover:text-[var(--text-inverse)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)]">Edit Cards</h4>
                  <p className="text-xs text-[var(--text-muted)]">Add, edit, or remove cards</p>
                </div>
              </div>
            </Link>

            <Link
              href={`/sets/${studySet.id}/import`}
              className="card p-5 hover:border-[var(--border-accent)] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-accent-subtle)] flex items-center justify-center group-hover:bg-[var(--bg-accent)] transition-colors">
                  <svg className="w-5 h-5 text-[var(--text-accent)] group-hover:text-[var(--text-inverse)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)]">Import Cards</h4>
                  <p className="text-xs text-[var(--text-muted)]">Bulk import from JSON</p>
                </div>
              </div>
            </Link>

            <Link
              href={`/practice?set=${studySet.id}`}
              className="card p-5 hover:border-[var(--border-accent)] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--success-bg)] flex items-center justify-center group-hover:bg-[var(--success-border)] transition-colors">
                  <svg className="w-5 h-5 text-[var(--success-text)] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)]">Study Now</h4>
                  <p className="text-xs text-[var(--text-muted)]">Start practicing</p>
                </div>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
