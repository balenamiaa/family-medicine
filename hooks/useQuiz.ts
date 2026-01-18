"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Question,
  QuestionType,
  Difficulty,
  SessionProgress,
  UserAnswer,
} from "@/types";
import { shuffle, getStoredValue, setStoredValue } from "@/lib/utils";
import { recordAnswer } from "@/lib/spacedRepetition";

const STORAGE_KEY = "medcram_progress";
const PRACTICE_STORAGE_KEY = "medcram_practice_progress";

interface UseQuizOptions {
  questions: Question[];
  shuffleQuestions?: boolean;
  filterTypes?: QuestionType[];
  filterDifficulty?: Difficulty[];
  questionIndices?: number[]; // For review mode - specific question indices to use
  persistKey?: string; // Custom storage key for different modes
  spacedRepetitionKey?: string;
}

interface UseQuizReturn {
  // Current state
  currentQuestion: Question | null;
  currentIndex: number;
  currentQuestionIndex: number; // Original index in the question bank
  totalQuestions: number;

  // Progress
  progress: SessionProgress;
  answeredCount: number;
  correctCount: number;
  streak: number;
  maxStreak: number;

  // Sets for navigation highlighting
  answeredIndices: Set<number>;
  correctIndices: Set<number>;

  // Question state
  isAnswered: boolean;
  isCorrect: boolean | null;
  isFeedbackGiven: boolean;

  // Actions
  answerQuestion: (correct: boolean, answer: UserAnswer) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  resetQuiz: () => void;
  resetSingleQuestion: (index: number) => void;
  shuffleRemaining: () => void;
  markFeedbackGiven: () => void;
}

function createInitialProgress(): SessionProgress {
  return {
    currentIndex: 0,
    answered: 0,
    correct: 0,
    streak: 0,
    maxStreak: 0,
    questionStates: {},
  };
}

export function useQuiz({
  questions: allQuestions,
  shuffleQuestions = false,
  filterTypes,
  filterDifficulty,
  questionIndices,
  persistKey = PRACTICE_STORAGE_KEY,
  spacedRepetitionKey,
}: UseQuizOptions): UseQuizReturn {
  // Filter questions based on type and difficulty, or use provided indices
  const filteredQuestionData = useMemo(() => {
    // If questionIndices is explicitly provided (even if empty), use only those indices
    if (questionIndices !== undefined) {
      return questionIndices
        .filter((i) => i >= 0 && i < allQuestions.length)
        .map((i) => ({ question: allQuestions[i], originalIndex: i }));
    }

    // Otherwise, use all questions with optional type/difficulty filters
    let result = allQuestions.map((q, i) => ({ question: q, originalIndex: i }));

    if (filterTypes && filterTypes.length > 0) {
      result = result.filter((item) => filterTypes.includes(item.question.question_type));
    }

    if (filterDifficulty && filterDifficulty.length > 0) {
      result = result.filter((item) => filterDifficulty.includes(item.question.difficulty));
    }

    return result;
  }, [allQuestions, filterTypes, filterDifficulty, questionIndices]);

  // Generate a cache key based on filters to separate progress for different filter combinations
  const filterCacheKey = useMemo(() => {
    if (questionIndices !== undefined) {
      return `${persistKey}_review`;
    }
    const typeKey = filterTypes?.sort().join(",") || "all";
    const diffKey = filterDifficulty?.sort().join(",") || "all";
    return `${persistKey}_${typeKey}_${diffKey}`;
  }, [persistKey, filterTypes, filterDifficulty, questionIndices]);

  // Initialize question order (indices into filteredQuestionData)
  const [questionOrder, setQuestionOrder] = useState<number[]>(() => {
    const order = filteredQuestionData.map((_, i) => i);
    return shuffleQuestions ? shuffle(order) : order;
  });

  // Session progress state - load from localStorage
  const [progress, setProgress] = useState<SessionProgress>(() => {
    if (typeof window === "undefined") return createInitialProgress();

    const stored = getStoredValue<SessionProgress | null>(filterCacheKey, null);
    if (stored) {
      // Validate that stored progress is compatible with current question set
      const maxStoredIndex = Math.max(
        stored.currentIndex,
        ...Object.keys(stored.questionStates).map(Number)
      );
      if (maxStoredIndex < filteredQuestionData.length) {
        return stored;
      }
    }
    return createInitialProgress();
  });

  // Re-shuffle when filteredQuestionData changes
  useEffect(() => {
    const order = filteredQuestionData.map((_, i) => i);
    setQuestionOrder(shuffleQuestions ? shuffle(order) : order);
  }, [filteredQuestionData, shuffleQuestions]);

  // Load progress when filter cache key changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = getStoredValue<SessionProgress | null>(filterCacheKey, null);
    if (stored) {
      const maxStoredIndex = Math.max(
        stored.currentIndex,
        ...Object.keys(stored.questionStates).map(Number).filter(n => !isNaN(n)),
        0
      );
      if (maxStoredIndex < filteredQuestionData.length) {
        setProgress(stored);
        return;
      }
    }
    setProgress(createInitialProgress());
  }, [filterCacheKey, filteredQuestionData.length]);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    setStoredValue(filterCacheKey, progress);
  }, [progress, filterCacheKey]);

  // Computed sets for navigation
  const answeredIndices = useMemo(() => {
    return new Set(
      Object.keys(progress.questionStates)
        .map(Number)
        .filter((i) => !isNaN(i) && progress.questionStates[i]?.answered)
    );
  }, [progress.questionStates]);

  const correctIndices = useMemo(() => {
    return new Set(
      Object.keys(progress.questionStates)
        .map(Number)
        .filter((i) => !isNaN(i) && progress.questionStates[i]?.correct === true)
    );
  }, [progress.questionStates]);

  // Current question derived from order and index
  const currentOrderIndex = questionOrder[progress.currentIndex];
  const currentData = currentOrderIndex !== undefined ? filteredQuestionData[currentOrderIndex] : null;
  const currentQuestion = currentData?.question ?? null;
  const currentQuestionIndex = currentData?.originalIndex ?? -1;

  // Current question state
  const questionState = progress.questionStates[progress.currentIndex];
  const isAnswered = questionState?.answered ?? false;
  const isCorrect = questionState?.correct ?? null;
  const isFeedbackGiven = questionState?.feedbackGiven ?? false;

  // Mark feedback as given for current question
  const markFeedbackGiven = useCallback(() => {
    setProgress((prev) => {
      const currentState = prev.questionStates[prev.currentIndex];
      if (!currentState) return prev;

      return {
        ...prev,
        questionStates: {
          ...prev.questionStates,
          [prev.currentIndex]: {
            ...currentState,
            feedbackGiven: true,
          },
        },
      };
    });
  }, []);

  // Answer the current question
  const answerQuestion = useCallback((correct: boolean, answer: UserAnswer) => {
    // Record in spaced repetition system
    if (currentQuestionIndex >= 0) {
      recordAnswer(currentQuestionIndex, correct, undefined, { storageKey: spacedRepetitionKey });
    }

    setProgress((prev) => {
      const newStreak = correct ? prev.streak + 1 : 0;
      const newMaxStreak = Math.max(prev.maxStreak, newStreak);

      return {
        ...prev,
        answered: prev.answered + 1,
        correct: prev.correct + (correct ? 1 : 0),
        streak: newStreak,
        maxStreak: newMaxStreak,
        questionStates: {
          ...prev.questionStates,
          [prev.currentIndex]: {
            questionIndex: prev.currentIndex,
            answered: true,
            correct,
            userAnswer: answer,
            showExplanation: true,
          },
        },
      };
    });
  }, [currentQuestionIndex]);

  // Navigation
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questionOrder.length) {
      setProgress((prev) => ({ ...prev, currentIndex: index }));
    }
  }, [questionOrder.length]);

  const nextQuestion = useCallback(() => {
    goToQuestion(progress.currentIndex + 1);
  }, [progress.currentIndex, goToQuestion]);

  const previousQuestion = useCallback(() => {
    goToQuestion(progress.currentIndex - 1);
  }, [progress.currentIndex, goToQuestion]);

  // Reset quiz
  const resetQuiz = useCallback(() => {
    const newOrder = shuffleQuestions
      ? shuffle(filteredQuestionData.map((_, i) => i))
      : filteredQuestionData.map((_, i) => i);

    setQuestionOrder(newOrder);
    const newProgress = createInitialProgress();
    setProgress(newProgress);

    // Clear from localStorage
    if (typeof window !== "undefined") {
      setStoredValue(filterCacheKey, newProgress);
    }
  }, [filteredQuestionData, shuffleQuestions, filterCacheKey]);

  // Reset a single question to allow re-answering
  const resetSingleQuestion = useCallback((index: number) => {
    setProgress((prev) => {
      const questionState = prev.questionStates[index];
      if (!questionState?.answered) return prev;

      const wasCorrect = questionState.correct;
      const { [index]: _, ...restStates } = prev.questionStates;

      return {
        ...prev,
        answered: Math.max(0, prev.answered - 1),
        correct: Math.max(0, prev.correct - (wasCorrect ? 1 : 0)),
        streak: 0, // Reset streak when retrying
        questionStates: restStates,
      };
    });
  }, []);

  // Shuffle remaining unanswered questions
  const shuffleRemaining = useCallback(() => {
    setQuestionOrder((prev) => {
      const answeredPositions = new Set(Object.keys(progress.questionStates).map(Number));
      const unansweredPositions = prev
        .map((_, i) => i)
        .filter((i) => !answeredPositions.has(i));

      const unansweredValues = unansweredPositions.map((i) => prev[i]);
      const shuffledUnanswered = shuffle(unansweredValues);

      let shuffleIndex = 0;
      return prev.map((val, i) => {
        if (answeredPositions.has(i)) {
          return val;
        }
        return shuffledUnanswered[shuffleIndex++];
      });
    });
  }, [progress.questionStates]);

  return {
    currentQuestion,
    currentIndex: progress.currentIndex,
    currentQuestionIndex,
    totalQuestions: questionOrder.length,
    progress,
    answeredCount: progress.answered,
    correctCount: progress.correct,
    streak: progress.streak,
    maxStreak: progress.maxStreak,
    answeredIndices,
    correctIndices,
    isAnswered,
    isCorrect,
    isFeedbackGiven,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    resetQuiz,
    resetSingleQuestion,
    shuffleRemaining,
    markFeedbackGiven,
  };
}
