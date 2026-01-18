"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CardTypeSelector, CardList, MCQEditor, TrueFalseEditor, EMQEditor, ClozeEditor, WrittenEditor } from "@/components/editor";
import { QuestionType, QUESTION_TYPE_LABELS, Difficulty, DIFFICULTY_LABELS } from "@/types";
import { cn } from "@/lib/utils";

interface Card {
  id: string;
  questionType: QuestionType;
  questionData: any;
  difficulty: Difficulty;
  orderIndex: number;
  explanation: string;
  retentionAid: string;
}

interface StudySet {
  id: string;
  title: string;
  cards: Card[];
  _permissions: {
    canEdit: boolean;
  };
}

export default function CardEditorPage() {
  const params = useParams();
  const router = useRouter();

  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardType, setNewCardType] = useState<QuestionType | null>(null);
  const [dirtyCardIds, setDirtyCardIds] = useState<Set<string>>(new Set());

  // Fetch study set with cards
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
      setCards(data.cards || []);
      setDirtyCardIds(new Set());
      if (data.cards?.length > 0) {
        setSelectedCardId(data.cards[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId);
  const dirtyCount = dirtyCardIds.size;
  const isSelectedDirty = selectedCardId ? dirtyCardIds.has(selectedCardId) : false;

  const markDirty = useCallback((cardId: string) => {
    setDirtyCardIds((prev) => {
      if (prev.has(cardId)) return prev;
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
  }, []);

  const clearDirty = useCallback((cardId: string) => {
    setDirtyCardIds((prev) => {
      if (!prev.has(cardId)) return prev;
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  }, []);

  // Create new card
  const createCard = async () => {
    if (!newCardType) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studySetId: params.id,
          questionType: newCardType,
          questionData: {},
          difficulty: 3,
          orderIndex: cards.length,
        }),
      });

      if (!response.ok) throw new Error("Failed to create card");
      const newCard = await response.json();
      setCards([...cards, newCard]);
      setSelectedCardId(newCard.id);
      setShowNewCard(false);
      setNewCardType(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create card");
    } finally {
      setIsSaving(false);
    }
  };

  // Update card
  const updateCard = useCallback(async (cardId: string, updates: Partial<Card>) => {
    markDirty(cardId);

    // Optimistic update
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, ...updates } : c))
    );
  }, [markDirty]);

  const persistCard = useCallback(async (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return false;

    const response = await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionData: card.questionData,
        difficulty: card.difficulty,
      }),
    });

    if (!response.ok) throw new Error("Failed to save card");
    return true;
  }, [cards]);

  // Save card to server
  const saveCard = async (cardId: string) => {
    setIsSaving(true);
    try {
      const ok = await persistCard(cardId);
      if (ok) clearDirty(cardId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllCards = async () => {
    if (dirtyCardIds.size === 0) return;
    setIsSaving(true);
    let lastError: string | null = null;
    const ids = Array.from(dirtyCardIds);
    for (const id of ids) {
      try {
        const ok = await persistCard(id);
        if (ok) clearDirty(id);
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Failed to save some cards";
      }
    }
    if (lastError) {
      setError(lastError);
    }
    setIsSaving(false);
  };

  // Delete card
  const deleteCard = async (cardId: string) => {
    if (!confirm("Delete this card?")) return;

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete card");

      const newCards = cards.filter((c) => c.id !== cardId);
      setCards(newCards);
      clearDirty(cardId);

      if (selectedCardId === cardId) {
        setSelectedCardId(newCards[0]?.id || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  // Duplicate card
  const duplicateCard = async (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studySetId: params.id,
          questionType: card.questionType,
          questionData: card.questionData,
          difficulty: card.difficulty,
          orderIndex: cards.length,
        }),
      });

      if (!response.ok) throw new Error("Failed to duplicate card");
      const newCard = await response.json();
      setCards([...cards, newCard]);
      setSelectedCardId(newCard.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate");
    } finally {
      setIsSaving(false);
    }
  };

  // Reorder cards
  const reorderCard = async (cardId: string, direction: "up" | "down") => {
    const cardIndex = cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const newIndex = direction === "up" ? cardIndex - 1 : cardIndex + 1;
    if (newIndex < 0 || newIndex >= cards.length) return;

    const newCards = [...cards];
    [newCards[cardIndex], newCards[newIndex]] = [newCards[newIndex], newCards[cardIndex]];

    // Update order indices
    newCards.forEach((c, i) => (c.orderIndex = i));
    setCards(newCards);

    // Save order to server
    try {
      await fetch("/api/cards/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studySetId: params.id,
          cardIds: newCards.map((c) => c.id),
        }),
      });
    } catch (err) {
      console.error("Failed to save order:", err);
    }
  };

  // Handle question data change
  const handleQuestionDataChange = (data: any) => {
    if (!selectedCardId) return;
    updateCard(selectedCardId, { questionData: data });
  };

  // Handle difficulty change
  const handleDifficultyChange = (difficulty: Difficulty) => {
    if (!selectedCardId) return;
    updateCard(selectedCardId, { difficulty });
  };

  // Render editor based on question type
  const renderEditor = () => {
    if (!selectedCard) return null;

    switch (selectedCard.questionType) {
      case "mcq_single":
        return (
          <MCQEditor
            data={selectedCard.questionData}
            isMulti={false}
            onChange={handleQuestionDataChange}
          />
        );
      case "mcq_multi":
        return (
          <MCQEditor
            data={selectedCard.questionData}
            isMulti={true}
            onChange={handleQuestionDataChange}
          />
        );
      case "true_false":
        return (
          <TrueFalseEditor
            data={selectedCard.questionData}
            onChange={handleQuestionDataChange}
          />
        );
      case "emq":
        return (
          <EMQEditor
            data={selectedCard.questionData}
            onChange={handleQuestionDataChange}
          />
        );
      case "cloze":
        return (
          <ClozeEditor
            data={selectedCard.questionData}
            onChange={handleQuestionDataChange}
          />
        );
      case "written":
        return (
          <WrittenEditor
            data={selectedCard.questionData}
            onChange={handleQuestionDataChange}
          />
        );
      default:
        return <div>Unknown question type</div>;
    }
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
        <Link href={`/sets/${params.id}`} className="hover:text-[var(--text-primary)] transition-colors truncate max-w-[200px]">
          {studySet.title}
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[var(--text-primary)]">Edit Cards</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
            Edit Cards
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {cards.length} {cards.length === 1 ? "card" : "cards"} in this set
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirtyCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--warning-border)] bg-[var(--warning-bg)] px-2.5 py-1 text-xs font-medium text-[var(--warning-text)]">
                Unsaved {dirtyCount}
              </span>
              {isSelectedDirty && selectedCardId && (
                <button
                  onClick={() => saveCard(selectedCardId)}
                  disabled={isSaving}
                  className="btn btn-primary"
                  aria-busy={isSaving}
                >
                  <span className="flex items-center gap-2">
                    {isSaving && (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    <span>Save Card</span>
                  </span>
                </button>
              )}
              {(dirtyCount > 1 || !isSelectedDirty) && (
                <button
                  onClick={saveAllCards}
                  disabled={isSaving}
                  className={cn(
                    "btn",
                    isSelectedDirty ? "btn-ghost" : "btn-primary"
                  )}
                  aria-busy={isSaving}
                >
                  <span className="flex items-center gap-2">
                    {isSaving && (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    <span>Save All</span>
                  </span>
                </button>
              )}
            </div>
          )}
          <Link
            href={`/sets/${params.id}/import`}
            className="btn btn-ghost"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import JSON
          </Link>
          <button
            onClick={() => setShowNewCard(true)}
            className="btn btn-ghost"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Card
          </button>
        </div>
      </div>

      {/* New card modal */}
      {showNewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowNewCard(false);
              setNewCardType(null);
            }}
          />
          <div className="relative w-full max-w-2xl card p-6 max-h-[90vh] overflow-y-auto animate-scale-in">
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-4">
              Choose Question Type
            </h2>
            <CardTypeSelector
              selectedType={newCardType}
              onSelect={setNewCardType}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={createCard}
                disabled={!newCardType || isSaving}
                className={cn(
                  "btn btn-primary flex-1",
                  (!newCardType || isSaving) && "opacity-50 cursor-not-allowed"
                )}
                aria-busy={isSaving}
              >
                <span className="flex items-center justify-center gap-2">
                  {isSaving && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Create Card</span>
                </span>
              </button>
              <button
                onClick={() => {
                  setShowNewCard(false);
                  setNewCardType(null);
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-[300px,1fr] items-start">
        {/* Card list */}
        <div className="card p-4 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] overflow-y-auto">
          <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Cards</h3>
          <CardList
            cards={cards}
            selectedCardId={selectedCardId}
            dirtyCardIds={dirtyCardIds}
            onSelect={setSelectedCardId}
            onDelete={deleteCard}
            onDuplicate={duplicateCard}
            onReorder={reorderCard}
          />
        </div>

        {/* Editor */}
        <div className="card p-6">
          {selectedCard ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-[var(--bg-accent-subtle)] text-sm font-medium text-[var(--text-accent)]">
                    {QUESTION_TYPE_LABELS[selectedCard.questionType]}
                  </span>
                  {isSelectedDirty && (
                    <span className="text-xs px-2 py-1 rounded-full border border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)] font-semibold uppercase tracking-wide">
                      Unsaved
                    </span>
                  )}
                </div>

                {/* Difficulty selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-muted)]">Difficulty:</span>
                  <div className="flex gap-1">
                    {([1, 2, 3, 4, 5] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => handleDifficultyChange(d)}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium transition-all",
                          selectedCard.difficulty === d
                            ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                            : "bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {renderEditor()}
            </>
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)]">
              {cards.length === 0 ? (
                <>
                  <p className="mb-4">No cards yet. Create your first card to get started.</p>
                  <button
                    onClick={() => setShowNewCard(true)}
                    className="btn btn-primary"
                  >
                    Create First Card
                  </button>
                </>
              ) : (
                <p>Select a card to edit</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
