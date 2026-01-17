"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Question, QuestionType } from "@/types";
import { getStoredValue, setStoredValue } from "@/lib/utils";

const ACTIVE_SET_KEY = "medcram_active_study_set";

const QUESTION_TYPES: QuestionType[] = ["mcq_single", "mcq_multi", "true_false", "emq", "cloze"];

export interface StudySetSummary {
  id: string;
  title: string;
  description: string | null;
  type: "SYSTEM" | "PUBLIC" | "PRIVATE";
  tags: string[];
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

interface StudySetCard {
  id: string;
  questionType: string;
  questionData: Record<string, unknown>;
  difficulty: number;
  orderIndex: number;
  explanation?: string;
  retentionAid?: string;
  tags?: string[];
}

export interface StudySetDetail extends StudySetSummary {
  cards: StudySetCard[];
}

export type StudyQuestion = Question & {
  id?: string;
  tags?: string[];
};

interface StudySetContextValue {
  sets: StudySetSummary[];
  activeSetId: string | null;
  activeSet: StudySetDetail | null;
  questions: StudyQuestion[];
  isLoading: boolean;
  isLoadingActive: boolean;
  error: string | null;
  selectSet: (id: string) => void;
  refreshSets: () => Promise<void>;
  refreshActiveSet: () => Promise<void>;
}

const StudySetContext = createContext<StudySetContextValue | null>(null);

function toStudyQuestion(card: StudySetCard): StudyQuestion | null {
  const questionType = card.questionType as QuestionType;
  if (!QUESTION_TYPES.includes(questionType)) return null;

  const content = card.questionData ?? {};
  const explanation = typeof content.explanation === "string"
    ? (content.explanation as string)
    : card.explanation ?? "";
  const retentionAid = typeof content.retention_aid === "string"
    ? (content.retention_aid as string)
    : card.retentionAid ?? "";

  return {
    ...(content as Record<string, unknown>),
    id: card.id,
    tags: card.tags ?? [],
    question_type: questionType,
    difficulty: card.difficulty as Question["difficulty"],
    explanation,
    retention_aid: retentionAid,
  } as StudyQuestion;
}

export function StudySetProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requestedSetId = searchParams.get("set");
  const [sets, setSets] = useState<StudySetSummary[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(() =>
    getStoredValue<string | null>(ACTIVE_SET_KEY, null)
  );
  const [activeSet, setActiveSet] = useState<StudySetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/study-sets", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load study sets");
      const data = await response.json();
      setSets(data.studySets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load study sets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshActiveSet = useCallback(async () => {
    if (!activeSetId) {
      setActiveSet(null);
      return;
    }

    try {
      setIsLoadingActive(true);
      setError(null);
      const response = await fetch(`/api/study-sets/${activeSetId}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load study set");
      const data = await response.json();
      setActiveSet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load study set");
      setActiveSet(null);
    } finally {
      setIsLoadingActive(false);
    }
  }, [activeSetId]);

  useEffect(() => {
    refreshSets();
  }, [refreshSets]);

  useEffect(() => {
    if (activeSetId) {
      setStoredValue(ACTIVE_SET_KEY, activeSetId);
    }
  }, [activeSetId]);

  useEffect(() => {
    if (sets.length === 0) return;

    if (requestedSetId && sets.some((set) => set.id === requestedSetId)) {
      if (requestedSetId !== activeSetId) {
        setActiveSetId(requestedSetId);
      }
      return;
    }

    if (!activeSetId || !sets.some((set) => set.id === activeSetId)) {
      const fallback = sets.find((set) => set.type === "SYSTEM") || sets[0];
      setActiveSetId(fallback.id);
    }
  }, [activeSetId, requestedSetId, sets]);

  useEffect(() => {
    refreshActiveSet();
  }, [refreshActiveSet]);

  const questions = useMemo(() => {
    if (!activeSet?.cards) return [];
    return activeSet.cards
      .map(toStudyQuestion)
      .filter((question): question is StudyQuestion => Boolean(question));
  }, [activeSet]);

  const selectSet = useCallback((id: string) => {
    setActiveSetId(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("set", id);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const value = useMemo(
    () => ({
      sets,
      activeSetId,
      activeSet,
      questions,
      isLoading,
      isLoadingActive,
      error,
      selectSet,
      refreshSets,
      refreshActiveSet,
    }),
    [
      sets,
      activeSetId,
      activeSet,
      questions,
      isLoading,
      isLoadingActive,
      error,
      selectSet,
      refreshSets,
      refreshActiveSet,
    ]
  );

  return (
    <StudySetContext.Provider value={value}>
      {children}
    </StudySetContext.Provider>
  );
}

export function useStudySet(): StudySetContextValue {
  const context = useContext(StudySetContext);
  if (!context) {
    throw new Error("useStudySet must be used within a StudySetProvider");
  }
  return context;
}
