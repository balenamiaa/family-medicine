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

const STORAGE_KEY = "medcram_progress";

interface UseQuizOptions {
  questions: Question[];
  shuffleQuestions?: boolean;
  filterTypes?: QuestionType[];
  filterDifficulty?: Difficulty[];
}

interface UseQuizReturn {
  // Current state
  currentQuestion: Question | null;
  currentIndex: number;
  totalQuestions: number;

  // Progress
  progress: SessionProgress;
  answeredCount: number;
  correctCount: number;
  streak: number;
  maxStreak: number;

  // Question state
  isAnswered: boolean;
  isCorrect: boolean | null;

  // Actions
  answerQuestion: (correct: boolean, answer: UserAnswer) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  resetQuiz: () => void;
  shuffleRemaining: () => void;
}

export function useQuiz({
  questions: allQuestions,
  shuffleQuestions = false,
  filterTypes,
  filterDifficulty,
}: UseQuizOptions): UseQuizReturn {
  // Filter questions based on type and difficulty
  const filteredQuestions = useMemo(() => {
    let result = allQuestions;

    if (filterTypes && filterTypes.length > 0) {
      result = result.filter((q) => filterTypes.includes(q.question_type));
    }

    if (filterDifficulty && filterDifficulty.length > 0) {
      result = result.filter((q) => filterDifficulty.includes(q.difficulty));
    }

    return result;
  }, [allQuestions, filterTypes, filterDifficulty]);

  // Initialize question order
  const [questionOrder, setQuestionOrder] = useState<number[]>(() => {
    const order = filteredQuestions.map((_, i) => i);
    return shuffleQuestions ? shuffle(order) : order;
  });

  // Session progress state
  const [progress, setProgress] = useState<SessionProgress>(() => {
    const stored = getStoredValue<SessionProgress | null>(STORAGE_KEY, null);

    // Only restore if the question count matches
    if (stored && Object.keys(stored.questionStates).length <= filteredQuestions.length) {
      return stored;
    }

    return {
      currentIndex: 0,
      answered: 0,
      correct: 0,
      streak: 0,
      maxStreak: 0,
      questionStates: {},
    };
  });

  // Persist progress to localStorage
  useEffect(() => {
    setStoredValue(STORAGE_KEY, progress);
  }, [progress]);

  // Current question derived from order and index
  const currentQuestion = useMemo(() => {
    const orderIndex = questionOrder[progress.currentIndex];
    return orderIndex !== undefined ? filteredQuestions[orderIndex] ?? null : null;
  }, [filteredQuestions, questionOrder, progress.currentIndex]);

  // Current question state
  const questionState = progress.questionStates[progress.currentIndex];
  const isAnswered = questionState?.answered ?? false;
  const isCorrect = questionState?.correct ?? null;

  // Answer the current question
  const answerQuestion = useCallback((correct: boolean, answer: UserAnswer) => {
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
  }, []);

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
      ? shuffle(filteredQuestions.map((_, i) => i))
      : filteredQuestions.map((_, i) => i);

    setQuestionOrder(newOrder);
    setProgress({
      currentIndex: 0,
      answered: 0,
      correct: 0,
      streak: 0,
      maxStreak: 0,
      questionStates: {},
    });
  }, [filteredQuestions, shuffleQuestions]);

  // Shuffle remaining unanswered questions
  const shuffleRemaining = useCallback(() => {
    setQuestionOrder((prev) => {
      const answered = Object.keys(progress.questionStates).map(Number);
      const unanswered = prev.filter((_, i) => !answered.includes(i));
      const shuffledUnanswered = shuffle(unanswered);

      let unansweredIndex = 0;
      return prev.map((orderIndex, i) => {
        if (answered.includes(i)) {
          return orderIndex;
        }
        return shuffledUnanswered[unansweredIndex++];
      });
    });
  }, [progress.questionStates]);

  return {
    currentQuestion,
    currentIndex: progress.currentIndex,
    totalQuestions: questionOrder.length,
    progress,
    answeredCount: progress.answered,
    correctCount: progress.correct,
    streak: progress.streak,
    maxStreak: progress.maxStreak,
    isAnswered,
    isCorrect,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    resetQuiz,
    shuffleRemaining,
  };
}
