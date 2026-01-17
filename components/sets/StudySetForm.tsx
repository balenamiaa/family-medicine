"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type StudySetType = "SYSTEM" | "PUBLIC" | "PRIVATE";

interface StudySetFormData {
  title: string;
  description: string;
  type: StudySetType;
  tags: string[];
}

interface StudySetFormProps {
  initialData?: Partial<StudySetFormData>;
  onSubmit: (data: StudySetFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  allowedTypes?: StudySetType[];
}

export function StudySetForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  isLoading = false,
  allowedTypes = ["PRIVATE", "PUBLIC"],
}: StudySetFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [type, setType] = useState<StudySetType>(initialData?.type ?? "PRIVATE");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        type,
        tags,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const allTypeOptions: { value: StudySetType; label: string; description: string }[] = [
    {
      value: "PRIVATE" as StudySetType,
      label: "Private",
      description: "Only you can see and study this set",
    },
    {
      value: "PUBLIC" as StudySetType,
      label: "Public",
      description: "Anyone can view and study this set",
    },
    {
      value: "SYSTEM" as StudySetType,
      label: "System",
      description: "Official set visible to all users",
    },
  ];
  const typeOptions = allTypeOptions.filter((opt) => allowedTypes.includes(opt.value));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-[var(--error-bg)] border border-[var(--error-border)] text-sm text-[var(--error-text)]">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Title <span className="text-[var(--error-text)]">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., IMCI Case Studies"
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all"
          disabled={isLoading}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe what this study set covers..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all resize-none"
          disabled={isLoading}
        />
      </div>

      {/* Type selection */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
          Visibility
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
              disabled={isLoading}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                type === option.value
                  ? "border-[var(--border-accent)] bg-[var(--bg-accent-subtle)]"
                  : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
              )}
            >
              <div className="font-medium text-[var(--text-primary)]">{option.label}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Tags
        </label>
        <div className="flex gap-2">
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add a tag..."
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={isLoading || !tagInput.trim()}
            className="btn btn-ghost"
          >
            Add
          </button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-card-hover)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] shadow-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-[var(--bg-card-hover)]"
                  disabled={isLoading}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "btn btn-primary flex-1",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            submitLabel
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
