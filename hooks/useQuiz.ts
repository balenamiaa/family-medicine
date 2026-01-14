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

interface UseQuizOptions {
  questions: Question[];
  shuffleQuestions?: boolean;
  filterTypes?: QuestionType[];
  filterDifficulty?: Difficulty[];
  questionIndices?: number[]; // For review mode - specific question indices to use
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
  questionIndices,
}: UseQuizOptions): UseQuizReturn {
  // Filter questions based on type and difficulty, or use provided indices
  const filteredQuestionData = useMemo(() => {
    if (questionIndices && questionIndices.length > 0) {
      // Use specific indices (for review mode)
      return questionIndices
        .filter((i) => i >= 0 && i < allQuestions.length)
        .map((i) => ({ question: allQuestions[i], originalIndex: i }));
    }

    let result = allQuestions.map((q, i) => ({ question: q, originalIndex: i }));

    if (filterTypes && filterTypes.length > 0) {
      result = result.filter((item) => filterTypes.includes(item.question.question_type));
    }

    if (filterDifficulty && filterDifficulty.length > 0) {
      result = result.filter((item) => filterDifficulty.includes(item.question.difficulty));
    }

    return result;
  }, [allQuestions, filterTypes, filterDifficulty, questionIndices]);

  // Initialize question order (indices into filteredQuestionData)
  const [questionOrder, setQuestionOrder] = useState<number[]>(() => {
    const order = filteredQuestionData.map((_, i) => i);
    return shuffleQuestions ? shuffle(order) : order;
  });

  // Re-shuffle when filteredQuestionData changes
  useEffect(() => {
    const order = filteredQuestionData.map((_, i) => i);
    setQuestionOrder(shuffleQuestions ? shuffle(order) : order);
  }, [filteredQuestionData, shuffleQuestions]);

  // Session progress state
  const [progress, setProgress] = useState<SessionProgress>({
    currentIndex: 0,
    answered: 0,
    correct: 0,
    streak: 0,
    maxStreak: 0,
    questionStates: {},
  });

  // Computed sets for navigation
  const answeredIndices = useMemo(() => {
    return new Set(
      Object.keys(progress.questionStates)
        .map(Number)
        .filter((i) => progress.questionStates[i]?.answered)
    );
  }, [progress.questionStates]);

  const correctIndices = useMemo(() => {
    return new Set(
      Object.keys(progress.questionStates)
        .map(Number)
        .filter((i) => progress.questionStates[i]?.correct === true)
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

  // Answer the current question
  const answerQuestion = useCallback((correct: boolean, answer: UserAnswer) => {
    // Record in spaced repetition system
    if (currentQuestionIndex >= 0) {
      recordAnswer(currentQuestionIndex, correct);
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
    setProgress({
      currentIndex: 0,
      answered: 0,
      correct: 0,
      streak: 0,
      maxStreak: 0,
      questionStates: {},
    });
  }, [filteredQuestionData, shuffleQuestions]);

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
    answerQuestion,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    resetQuiz,
    shuffleRemaining,
  };
}
