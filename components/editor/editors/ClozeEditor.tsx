"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface ClozeData {
  text: string;
  blanks: string[];
  explanation: string;
  retention_aid: string;
}

interface ClozeEditorProps {
  data: ClozeData | null;
  onChange: (data: ClozeData) => void;
}

export function ClozeEditor({ data, onChange }: ClozeEditorProps) {
  const [text, setText] = useState(data?.text ?? "");
  const [explanation, setExplanation] = useState(data?.explanation ?? "");
  const [retentionAid, setRetentionAid] = useState(data?.retention_aid ?? "");

  // Extract blanks from text
  const blanks = useMemo(() => {
    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(m => m.slice(2, -2));
  }, [text]);

  // Sync changes
  useEffect(() => {
    onChange({
      text,
      blanks,
      explanation,
      retention_aid: retentionAid,
    });
  }, [text, blanks, explanation, retentionAid]);

  // Insert blank at cursor position
  const insertBlank = () => {
    const textarea = document.querySelector('textarea[data-cloze-input]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    const blankText = selectedText || "answer";

    const newText = text.substring(0, start) + `{{${blankText}}}` + text.substring(end);
    setText(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + blankText.length);
    }, 0);
  };

  // Preview with blanks highlighted
  const preview = useMemo(() => {
    let blankIndex = 0;
    return text.replace(/\{\{([^}]+)\}\}/g, () => {
      blankIndex++;
      return `[Blank ${blankIndex}]`;
    });
  }, [text]);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 rounded-xl bg-[var(--bg-accent-subtle)] border border-[var(--border-accent)]">
        <p className="text-sm text-[var(--text-secondary)]">
          <strong>How to create blanks:</strong> Wrap text in double curly braces like{" "}
          <code className="px-1.5 py-0.5 bg-[var(--bg-secondary)] rounded text-[var(--text-accent)]">
            {"{{answer}}"}
          </code>
          {" "}or select text and click &quot;Insert Blank&quot;.
        </p>
      </div>

      {/* Text input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            Text with Blanks <span className="text-[var(--error-text)]">*</span>
          </label>
          <button
            type="button"
            onClick={insertBlank}
            className="text-sm text-[var(--text-accent)] hover:underline"
          >
            + Insert Blank
          </button>
        </div>
        <textarea
          data-cloze-input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="The {{answer}} is the correct term. Another {{blank}} goes here."
          rows={5}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all resize-none font-mono text-sm"
        />
      </div>

      {/* Preview */}
      {blanks.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Preview
          </label>
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
              {text.split(/(\{\{[^}]+\}\})/).map((part, i) => {
                if (part.match(/^\{\{[^}]+\}\}$/)) {
                  return (
                    <span
                      key={i}
                      className="inline-block px-3 py-1 mx-1 rounded-lg bg-[var(--bg-accent-subtle)] border border-dashed border-[var(--border-accent)] text-[var(--text-accent)] font-medium"
                    >
                      ______
                    </span>
                  );
                }
                return part;
              })}
            </p>
          </div>

          {/* Answers list */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-[var(--text-muted)]">Answers:</span>
            {blanks.map((blank, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-[var(--success-bg)] text-xs text-[var(--success-text)]"
              >
                {i + 1}. {blank}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Explanation
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain the correct answers..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all resize-none"
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">Supports Markdown formatting</p>
      </div>

      {/* Retention aid */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Memory Trick
        </label>
        <textarea
          value={retentionAid}
          onChange={(e) => setRetentionAid(e.target.value)}
          placeholder="Add a mnemonic or memory trick..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 transition-all resize-none"
        />
      </div>
    </div>
  );
}
