"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { QUESTION_TYPE_LABELS } from "@/types";

interface JsonImporterProps {
  studySetId: string;
  onImportComplete?: (importedCount: number) => void;
  onClose?: () => void;
}

interface ValidationResult {
  valid: boolean;
  questionCount: number;
  errors: string[];
  preview: QuestionPreview[];
}

interface QuestionPreview {
  index: number;
  type: string;
  preview: string;
}

export function JsonImporter({ studySetId, onImportComplete, onClose }: JsonImporterProps) {
  const [jsonText, setJsonText] = useState("");
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate JSON
  const validateJson = useCallback((text: string): ValidationResult => {
    try {
      const parsed = JSON.parse(text);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;

      if (!Array.isArray(questions)) {
        return {
          valid: false,
          questionCount: 0,
          errors: ["JSON must be an array of questions or an object with a 'questions' array"],
          preview: [],
        };
      }

      const errors: string[] = [];
      const preview: QuestionPreview[] = [];

      questions.forEach((q: any, i: number) => {
        const type = q.question_type;
        if (!type) {
          errors.push(`Question ${i + 1}: missing question_type`);
          return;
        }

        let previewText = "";
        switch (type) {
          case "mcq_single":
          case "mcq_multi":
            previewText = q.question_text?.slice(0, 100) || "(no question text)";
            if (!q.question_text) errors.push(`Question ${i + 1}: missing question_text`);
            if (!Array.isArray(q.options) || q.options.length < 2) {
              errors.push(`Question ${i + 1}: needs at least 2 options`);
            }
            break;
          case "true_false":
            previewText = q.question_text?.slice(0, 100) || "(no question text)";
            if (!q.question_text) errors.push(`Question ${i + 1}: missing question_text`);
            if (typeof q.is_correct_true !== "boolean") {
              errors.push(`Question ${i + 1}: is_correct_true must be true or false`);
            }
            break;
          case "emq":
            previewText = `${q.premises?.length || 0} premises, ${q.options?.length || 0} options`;
            if (!Array.isArray(q.premises) || q.premises.length === 0) {
              errors.push(`Question ${i + 1}: needs at least 1 premise`);
            }
            if (!Array.isArray(q.options) || q.options.length < 2) {
              errors.push(`Question ${i + 1}: needs at least 2 options`);
            }
            break;
          case "cloze":
            previewText = q.question_text?.slice(0, 100) || "(no question text)";
            if (!q.question_text) errors.push(`Question ${i + 1}: missing question_text`);
            if (!Array.isArray(q.answers) || q.answers.length === 0) {
              errors.push(`Question ${i + 1}: needs at least 1 answer`);
            }
            break;
          case "written":
            previewText = q.question_text?.slice(0, 100) || "(no question text)";
            if (!q.question_text) errors.push(`Question ${i + 1}: missing question_text`);
            if (!q.correct_answer) errors.push(`Question ${i + 1}: missing correct_answer`);
            break;
          default:
            errors.push(`Question ${i + 1}: unknown question_type "${type}"`);
            previewText = "(unknown type)";
        }

        preview.push({
          index: i + 1,
          type: QUESTION_TYPE_LABELS[type as keyof typeof QUESTION_TYPE_LABELS] || type,
          preview: previewText,
        });
      });

      return {
        valid: errors.length === 0,
        questionCount: questions.length,
        errors,
        preview: preview.slice(0, 10), // Show first 10
      };
    } catch (e) {
      return {
        valid: false,
        questionCount: 0,
        errors: [`Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`],
        preview: [],
      };
    }
  }, []);

  // Handle text change with debounced validation
  const handleTextChange = (text: string) => {
    setJsonText(text);
    setError(null);
    setImportResult(null);

    if (text.trim()) {
      setIsValidating(true);
      // Simple debounce
      setTimeout(() => {
        setValidation(validateJson(text));
        setIsValidating(false);
      }, 300);
    } else {
      setValidation(null);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      setValidation(validateJson(text));
    };
    reader.readAsText(file);
  };

  // Import questions
  const handleImport = async () => {
    if (!validation?.valid) return;

    setIsImporting(true);
    setError(null);

    try {
      const parsed = JSON.parse(jsonText);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;

      const response = await fetch(`/api/study-sets/${studySetId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, mode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }

      setImportResult({ success: true, count: result.imported });
      onImportComplete?.(result.imported);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 rounded-xl bg-[var(--bg-accent-subtle)] border border-[var(--border-accent)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">JSON Format</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Import an array of questions. Each question needs a <code className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded">question_type</code> field.
        </p>
        <details className="group">
          <summary className="text-sm text-[var(--text-accent)] cursor-pointer hover:underline">
            View example format
          </summary>
          <pre className="mt-3 p-3 rounded-lg bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)] overflow-x-auto font-mono">
{`[
  {
    "question_type": "mcq_single",
    "question_text": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correct_index": 1,
    "difficulty": 2,
    "explanation": "Paris is the capital of France."
  },
  {
    "question_type": "true_false",
    "question_text": "The sun rises in the west.",
    "is_correct_true": false,
    "difficulty": 1
  },
  {
    "question_type": "cloze",
    "question_text": "The {1} of France is {2}.",
    "answers": ["capital", "Paris"],
    "difficulty": 3
  },
  {
    "question_type": "written",
    "question_text": "Explain the clinical significance of homeostatic reserve.",
    "correct_answer": "Homeostatic reserve is the excess capacity of organ systems to respond to stress...",
    "difficulty": 3
  }
]`}
          </pre>
        </details>
      </div>

      {/* File upload */}
      <div className="flex gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-ghost flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload JSON File
        </button>
        <span className="text-sm text-[var(--text-muted)] self-center">or paste JSON below</span>
      </div>

      {/* JSON input */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          JSON Data
        </label>
        <textarea
          value={jsonText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Paste your JSON array of questions here..."
          rows={12}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all resize-none font-mono text-sm"
        />
      </div>

      {/* Validation results */}
      {isValidating && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Validating...
        </div>
      )}

      {validation && !isValidating && (
        <div className={cn(
          "p-4 rounded-xl border",
          validation.valid
            ? "bg-[var(--success-bg)] border-[var(--success-border)]"
            : "bg-[var(--error-bg)] border-[var(--error-border)]"
        )}>
          <div className="flex items-center gap-2 mb-2">
            {validation.valid ? (
              <>
                <svg className="w-5 h-5 text-[var(--success-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-[var(--success-text)]">
                  Valid: {validation.questionCount} questions ready to import
                </span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-[var(--error-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-[var(--error-text)]">
                  {validation.errors.length} validation error{validation.errors.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>

          {validation.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-[var(--error-text)]">
              {validation.errors.slice(0, 5).map((err, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="mt-1">•</span>
                  <span>{err}</span>
                </li>
              ))}
              {validation.errors.length > 5 && (
                <li className="text-[var(--text-muted)]">
                  ...and {validation.errors.length - 5} more errors
                </li>
              )}
            </ul>
          )}

          {validation.preview.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
              <p className="text-xs text-[var(--text-muted)] mb-2">Preview:</p>
              <div className="space-y-1">
                {validation.preview.map((q) => (
                  <div key={q.index} className="text-xs flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                      {q.index}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[var(--bg-accent-subtle)] text-[var(--text-accent)]">
                      {q.type}
                    </span>
                    <span className="text-[var(--text-secondary)] truncate">{q.preview}</span>
                  </div>
                ))}
                {validation.questionCount > 10 && (
                  <p className="text-xs text-[var(--text-muted)]">
                    ...and {validation.questionCount - 10} more questions
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import mode */}
      {validation?.valid && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Import Mode
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === "append"}
                onChange={() => setMode("append")}
                className="w-4 h-4 text-[var(--bg-accent)] focus:ring-[var(--border-accent)]"
              />
              <span className="text-sm text-[var(--text-primary)]">Append to existing cards</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
                className="w-4 h-4 text-[var(--bg-accent)] focus:ring-[var(--border-accent)]"
              />
              <span className="text-sm text-[var(--text-primary)]">Replace all cards</span>
            </label>
          </div>
          {mode === "replace" && (
            <p className="mt-2 text-xs text-[var(--warning-text)]">
              Warning: This will delete all existing cards in this study set.
            </p>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-[var(--error-bg)] border border-[var(--error-border)] text-[var(--error-text)]">
          {error}
        </div>
      )}

      {/* Success message */}
      {importResult?.success && (
        <div className="p-4 rounded-xl bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success-text)]">
          Successfully imported {importResult.count} questions!
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleImport}
          disabled={!validation?.valid || isImporting}
          className={cn(
            "btn btn-primary flex-1",
            (!validation?.valid || isImporting) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isImporting ? (
            <>
              <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Importing...
            </>
          ) : (
            `Import ${validation?.questionCount || 0} Questions`
          )}
        </button>
        {onClose && (
          <button onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
