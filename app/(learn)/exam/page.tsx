"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { QuestionCard } from "@/components/QuestionCard";
import {
  ProgressRing,
  QuestionNavigator,
  ToastNotice,
} from "@/components/ui";
import { StudySetSelector, useStudySet } from "@/components/sets";
import { useQuiz } from "@/hooks/useQuiz";
import { startSession, recordQuestionAnswered } from "@/lib/stats";
import { playSoundIfEnabled } from "@/lib/sounds";
import { overrideLastReviewQuality, Quality } from "@/lib/spacedRepetition";
import { QuestionType, Difficulty, QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from "@/types";
import { cn, formatPercent, shuffle } from "@/lib/utils";
import { scopedKey } from "@/lib/storage";

type ExamState = "setup" | "running" | "finished";

interface ExamConfig {
  questionCount: number;
  timeLimit: number; // minutes
  questionTypes: QuestionType[];
  difficulties: Difficulty[];
  selectedTopics: string[];
}

// Topics are derived from study set tags instead of hardcoded keywords.

const QUESTION_TYPES: QuestionType[] = ["mcq_single", "mcq_multi", "true_false", "emq", "cloze", "written"];
const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4, 5];

export default function ExamPage() {
  const { activeSet, questions, isLoading, isLoadingActive, error } = useStudySet();
  const statsKey = scopedKey("medcram_study_stats", activeSet?.id);
  const progressKey = scopedKey("medcram_exam_progress", activeSet?.id);
  const srKey = scopedKey("medcram_spaced_repetition", activeSet?.id);

  // Exam state
  const [examState, setExamState] = useState<ExamState>("setup");
  const [config, setConfig] = useState<ExamConfig>({
    questionCount: 20,
    timeLimit: 30,
    questionTypes: [],
    difficulties: [],
    selectedTopics: [],
  });

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [showToolbar, setShowToolbar] = useState(true);
  const [resetQuestion, setResetQuestion] = useState<number | null>(null);
  const [showResetToast, setShowResetToast] = useState(false);

  // Generate random question indices for exam
  const generateExamQuestions = useCallback(() => {
    let filtered = questions.map((q, i) => ({ question: q, index: i }));

    if (config.questionTypes.length > 0) {
      filtered = filtered.filter((item) =>
        config.questionTypes.includes(item.question.question_type)
      );
    }

    if (config.difficulties.length > 0) {
      filtered = filtered.filter((item) =>
        config.difficulties.includes(item.question.difficulty)
      );
    }

    if (config.selectedTopics.length > 0) {
      filtered = filtered.filter((item) => {
        const tags = item.question.tags ?? [];
        return tags.some((tag) => config.selectedTopics.includes(tag));
      });
    }

    const shuffled = shuffle(filtered);
    const selected = shuffled.slice(0, Math.min(config.questionCount, shuffled.length));
    return selected.map((item) => item.index);
  }, [config]);

  // Quiz hook
  const {
    progress,
    currentQuestion,
    currentIndex,
    currentQuestionIndex,
    totalQuestions,
    answeredCount,
    correctCount,
    answeredIndices,
    correctIndices,
    isAnswered,
    isCorrect,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    resetQuiz,
    resetSingleQuestion,
    resetReason,
    clearResetReason,
  } = useQuiz({
    questions,
    questionIndices: selectedIndices,
    shuffleQuestions: false,
    persistKey: progressKey,
    spacedRepetitionKey: srKey,
  });

  useEffect(() => {
    if (resetReason === "content-change") {
      setShowResetToast(true);
      clearResetReason();
    }
  }, [resetReason, clearResetReason]);

  useEffect(() => {
    if (!showResetToast) return;
    const timer = window.setTimeout(() => setShowResetToast(false), 4500);
    return () => window.clearTimeout(timer);
  }, [showResetToast]);

  // Track answers in stats
  const handleAnswer = (correct: boolean, answer: Parameters<typeof answerQuestion>[1]) => {
    answerQuestion(correct, answer);
    recordQuestionAnswered(correct, 0, statsKey);
  };

  const handleFeedback = (quality: Quality) => {
    if (currentQuestionIndex < 0) return;
    overrideLastReviewQuality(currentQuestionIndex, quality, srKey);
  };

  // Reset current question
  const handleResetQuestion = useCallback(() => {
    if (resetSingleQuestion) {
      resetSingleQuestion(currentIndex);
      setResetQuestion(currentIndex);
      setTimeout(() => setResetQuestion(null), 600);
      playSoundIfEnabled("click");
    }
  }, [currentIndex, resetSingleQuestion]);

  // Start exam
  const startExam = () => {
    const indices = generateExamQuestions();
    setSelectedIndices(indices);
    setTimeRemaining(config.timeLimit * 60);
    setExamState("running");
    startSession(statsKey);
    playSoundIfEnabled("click");
  };

  // Timer effect
  useEffect(() => {
    if (examState !== "running" || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setExamState("finished");
          playSoundIfEnabled("complete");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examState, timeRemaining]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // End exam early
  const finishExam = () => {
    setExamState("finished");
    playSoundIfEnabled("complete");
  };

  // Reset for new exam
  const resetExam = () => {
    setExamState("setup");
    setSelectedIndices([]);
    setTimeRemaining(0);
    resetQuiz();
  };

  useEffect(() => {
    resetExam();
  }, [activeSet?.id]);

  // Calculate available questions based on filters
  const availableCount = useMemo(() => {
    let filtered = questions;

    if (config.questionTypes.length > 0) {
      filtered = filtered.filter((q) =>
        config.questionTypes.includes(q.question_type)
      );
    }

    if (config.difficulties.length > 0) {
      filtered = filtered.filter((q) =>
        config.difficulties.includes(q.difficulty)
      );
    }

    if (config.selectedTopics.length > 0) {
      filtered = filtered.filter((q) => {
        const tags = q.tags ?? [];
        return tags.some((tag) => config.selectedTopics.includes(tag));
      });
    }

    return filtered.length;
  }, [questions, config.questionTypes, config.difficulties, config.selectedTopics]);

  // Topic counts
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach((q) => {
      const tags = q.tags ?? [];
      tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [questions]);

  const topics = useMemo(() => {
    return Object.entries(topicCounts)
      .map(([tag, count]) => ({ id: tag, label: tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [topicCounts]);

  const activeExamChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

    config.questionTypes.forEach((type) => {
      chips.push({
        key: `type-${type}`,
        label: QUESTION_TYPE_LABELS[type],
        onRemove: () =>
          setConfig((c) => ({
            ...c,
            questionTypes: c.questionTypes.filter((t) => t !== type),
          })),
      });
    });

    config.difficulties.forEach((diff) => {
      chips.push({
        key: `diff-${diff}`,
        label: `Difficulty: ${DIFFICULTY_LABELS[diff]}`,
        onRemove: () =>
          setConfig((c) => ({
            ...c,
            difficulties: c.difficulties.filter((d) => d !== diff),
          })),
      });
    });

    config.selectedTopics.forEach((topic) => {
      chips.push({
        key: `topic-${topic}`,
        label: `Tag: ${topic}`,
        onRemove: () =>
          setConfig((c) => ({
            ...c,
            selectedTopics: c.selectedTopics.filter((t) => t !== topic),
          })),
      });
    });

    return chips;
  }, [config.difficulties, config.questionTypes, config.selectedTopics]);

  const clearExamFilters = () => {
    setConfig((c) => ({
      ...c,
      questionTypes: [],
      difficulties: [],
      selectedTopics: [],
    }));
  };

  // Timer urgency level
  const timerUrgency = useMemo(() => {
    const percentage = timeRemaining / (config.timeLimit * 60);
    if (percentage > 0.5) return "normal";
    if (percentage > 0.2) return "warning";
    return "critical";
  }, [timeRemaining, config.timeLimit]);

  return (
    <div className="min-h-[80vh]">
      {showResetToast && (
        <ToastNotice
          tone="warning"
          title="Study set updated"
          message="Your answers were cleared because this set changed."
          onDismiss={() => setShowResetToast(false)}
        />
      )}
      {/* Running State - Command Bar */}
      <AnimatePresence>
        {examState === "running" && showToolbar && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-2xl backdrop-blur-xl border shadow-2xl",
              "bg-[var(--bg-card)]/95 border-[var(--border-subtle)]",
              timerUrgency === "critical" && "border-[var(--error-border)] shadow-[var(--error-border)]/20"
            )}>
              {/* Timer */}
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold tabular-nums transition-colors",
                timerUrgency === "normal" && "text-[var(--text-primary)]",
                timerUrgency === "warning" && "text-amber-500 bg-amber-500/10",
                timerUrgency === "critical" && "text-[var(--error-text)] bg-[var(--error-bg)] animate-pulse"
              )}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(timeRemaining)}
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-[var(--border-subtle)]" />

              {/* Progress */}
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[var(--success-border)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)] tabular-nums">{correctCount}</span>
                </div>
                <span className="text-[var(--text-muted)]">/</span>
                <span className="text-sm font-medium text-[var(--text-secondary)] tabular-nums">{answeredCount}</span>
                <span className="text-xs text-[var(--text-muted)]">of {totalQuestions}</span>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-[var(--border-subtle)]" />

              {/* Actions */}
              <div className="flex items-center gap-1 px-2">
                {/* Reset Question Button */}
                <motion.button
                  onClick={handleResetQuestion}
                  disabled={!isAnswered}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                    isAnswered
                      ? "bg-[var(--bg-accent-subtle)] text-[var(--text-accent)] hover:bg-[var(--bg-accent)] hover:text-[var(--text-inverse)]"
                      : "text-[var(--text-muted)]/50 cursor-not-allowed"
                  )}
                  title="Reset this question (R)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Retry</span>
                </motion.button>

                {/* Finish Button */}
                <motion.button
                  onClick={finishExam}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--error-bg)] hover:text-[var(--error-text)] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden sm:inline">Finish</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcut for reset */}
      {examState === "running" && (
        <KeyboardListener
          onReset={handleResetQuestion}
          enabled={isAnswered}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Setup State */}
        {examState === "setup" && (
          <div className="space-y-8">
            <StudySetSelector />

            {isLoading || isLoadingActive ? (
              <div className="card p-6 animate-pulse">
                <div className="h-5 w-40 bg-[var(--bg-secondary)] rounded mb-3" />
                <div className="h-4 w-2/3 bg-[var(--bg-secondary)] rounded mb-6" />
                <div className="h-64 bg-[var(--bg-secondary)] rounded" />
              </div>
            ) : error ? (
              <div className="card p-6 border-[var(--error-border)] bg-[var(--error-bg)]">
                <h3 className="text-sm font-semibold text-[var(--error-text)] mb-2">
                  Unable to load exam setup
                </h3>
                <p className="text-sm text-[var(--text-muted)]">{error}</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="card p-8 text-center">
                <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                  No questions in this set
                </h3>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  Import questions or switch to another study set.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link href="/sets" className="btn btn-ghost text-sm">
                    Manage Sets
                  </Link>
                  <Link href="/browse" className="btn btn-primary text-sm">
                    Browse Sets
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Hero Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-4"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-accent-subtle)] text-[var(--text-accent)] text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Timed Assessment
                  </div>
                  <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--text-primary)]">
                    Exam Mode
                  </h1>
                  <p className="text-lg text-[var(--text-muted)] max-w-md mx-auto">
                    Simulate a real exam environment with time pressure
                  </p>
                </motion.div>

            {topics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Filter by Tags
                  </h2>
                  {config.selectedTopics.length > 0 && (
                    <button
                      onClick={() => setConfig(c => ({ ...c, selectedTopics: [] }))}
                      className="text-xs text-[var(--text-accent)] hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {topics.map((topic, i) => {
                    const isSelected = config.selectedTopics.includes(topic.id);

                    return (
                      <motion.button
                        key={topic.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * i }}
                        onClick={() => setConfig(c => ({
                          ...c,
                          selectedTopics: isSelected
                            ? c.selectedTopics.filter(t => t !== topic.id)
                            : [...c.selectedTopics, topic.id]
                        }))}
                        className={cn(
                          "group relative p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                          isSelected
                            ? "bg-[var(--bg-accent)] border-[var(--bg-accent)] text-[var(--text-inverse)] shadow-lg shadow-[var(--bg-accent)]/20"
                            : "bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-accent)] hover:shadow-md"
                        )}
                      >
                        <div className={cn(
                          "text-sm font-semibold mb-1",
                          isSelected ? "text-[var(--text-inverse)]" : "text-[var(--text-primary)]"
                        )}>
                          {topic.label}
                        </div>
                        <div className={cn(
                          "text-xs tabular-nums",
                          isSelected ? "text-[var(--text-inverse)]/70" : "text-[var(--text-muted)]"
                        )}>
                          {topic.count} questions
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

                {/* Configuration Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid md:grid-cols-2 gap-4"
                >
              {/* Questions & Time */}
              <div className="card p-6 space-y-6">
                <div>
                  <label className="text-sm font-semibold text-[var(--text-muted)] mb-3 block">
                    Number of Questions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[10, 20, 30, 50].map((count) => (
                      <button
                        key={count}
                        onClick={() => setConfig((c) => ({ ...c, questionCount: Math.min(count, availableCount) }))}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                          config.questionCount === Math.min(count, availableCount)
                            ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                            : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                        )}
                      >
                        {count}
                      </button>
                    ))}
                    <button
                      onClick={() => setConfig((c) => ({ ...c, questionCount: availableCount }))}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        config.questionCount === availableCount
                          ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                      )}
                    >
                      All ({availableCount})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[var(--text-muted)] mb-3 block">
                    Time Limit
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[15, 30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setConfig((c) => ({ ...c, timeLimit: mins }))}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                          config.timeLimit === mins
                            ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                            : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                        )}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="card p-6 space-y-6">
                <div>
                  <label className="text-sm font-semibold text-[var(--text-muted)] mb-3 block">
                    Question Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {QUESTION_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() =>
                          setConfig((c) => ({
                            ...c,
                            questionTypes: c.questionTypes.includes(type)
                              ? c.questionTypes.filter((t) => t !== type)
                              : [...c.questionTypes, type],
                          }))
                        }
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          config.questionTypes.includes(type)
                            ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                            : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                        )}
                      >
                        {QUESTION_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[var(--text-muted)] mb-3 block">
                    Difficulty
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DIFFICULTIES.map((diff) => (
                      <button
                        key={diff}
                        onClick={() =>
                          setConfig((c) => ({
                            ...c,
                            difficulties: c.difficulties.includes(diff)
                              ? c.difficulties.filter((d) => d !== diff)
                              : [...c.difficulties, diff],
                          }))
                        }
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          config.difficulties.includes(diff)
                            ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                            : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                        )}
                      >
                        {DIFFICULTY_LABELS[diff]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {activeExamChips.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/80 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Active Filters
                  </span>
                  {activeExamChips.map((chip) => (
                    <button
                      key={chip.key}
                      onClick={chip.onRemove}
                      className={cn(
                        "group inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                        "border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
                        "hover:border-[var(--border-accent)] hover:bg-[var(--bg-accent-subtle)]"
                      )}
                    >
                      <span>{chip.label}</span>
                      <span className="text-[var(--text-muted)] group-hover:text-[var(--text-accent)]">
                        ×
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={clearExamFilters}
                    className="ml-auto text-xs text-[var(--text-accent)] hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              </motion.div>
            )}

            {/* Start Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="text-center">
                {availableCount === 0 ? (
                  <p className="text-[var(--error-text)]">No questions match your filters</p>
                ) : (
                  <p className="text-[var(--text-muted)]">
                    <span className="font-bold text-[var(--text-primary)]">{Math.min(config.questionCount, availableCount)}</span> questions
                    {" · "}
                    <span className="font-bold text-[var(--text-primary)]">{config.timeLimit}</span> minutes
                    {" · "}
                    <span className="text-[var(--text-accent)]">{Math.round((config.timeLimit * 60) / Math.min(config.questionCount, availableCount))}s</span> per question
                  </p>
                )}
              </div>

              <motion.button
                onClick={startExam}
                disabled={availableCount === 0}
                whileHover={{ scale: availableCount > 0 ? 1.02 : 1 }}
                whileTap={{ scale: availableCount > 0 ? 0.98 : 1 }}
                className={cn(
                  "px-12 py-4 rounded-2xl text-lg font-bold transition-all",
                  availableCount > 0
                    ? "bg-[var(--bg-accent)] text-[var(--text-inverse)] shadow-xl shadow-[var(--bg-accent)]/30 hover:shadow-2xl"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                )}
              >
                Begin Exam →
              </motion.button>
            </motion.div>
              </>
            )}
          </div>
        )}

        {/* Running State */}
        {examState === "running" && (
          <div className="grid gap-8 lg:grid-cols-[1fr,320px] pt-16">
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {currentQuestion && (
                  <motion.div
                    key={`${currentIndex}-${resetQuestion === currentIndex ? 'reset' : 'normal'}`}
                    initial={{ opacity: 0, x: resetQuestion === currentIndex ? 0 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <QuestionCard
                      question={currentQuestion}
                      questionNumber={currentIndex + 1}
                      questionIndex={currentQuestionIndex}
                      totalQuestions={totalQuestions}
                      isAnswered={isAnswered}
                      isCorrect={isCorrect}
                      userAnswer={progress.questionStates[currentIndex]?.userAnswer}
                      onAnswer={handleAnswer}
                      onNext={nextQuestion}
                      onPrevious={previousQuestion}
                      canGoNext={currentIndex < totalQuestions - 1}
                      canGoPrevious={currentIndex > 0}
                      onReset={handleResetQuestion}
                      onFeedback={handleFeedback}
                      showBookmark={false}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigator */}
              <QuestionNavigator
                totalQuestions={totalQuestions}
                currentIndex={currentIndex}
                answeredIndices={answeredIndices}
                correctIndices={correctIndices}
                onNavigate={goToQuestion}
              />
            </div>

            {/* Sidebar */}
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              {/* Progress */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4">Progress</h3>
                <div className="flex items-center justify-center mb-4">
                  <ProgressRing value={answeredCount} max={totalQuestions} size={80} strokeWidth={6} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[var(--success-bg)]">
                    <div className="text-xl font-bold text-[var(--success-text)] tabular-nums">{correctCount}</div>
                    <div className="text-xs text-[var(--text-muted)]">Correct</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                    <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                      {answeredCount - correctCount}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">Incorrect</div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Shortcuts</h3>
                <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-[var(--bg-secondary)] rounded">R</kbd>
                    <span>Reset question</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-[var(--bg-secondary)] rounded">←→</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-[var(--bg-secondary)] rounded">1-5</kbd>
                    <span>Select option</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-[var(--bg-secondary)] rounded">1-3</kbd>
                    <span>Feedback</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Finished State */}
        {examState === "finished" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="card p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, stiffness: 100 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--bg-accent)] to-[var(--success-border)] flex items-center justify-center shadow-lg"
              >
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>

              <h2 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-2">
                Exam Complete!
              </h2>

              <p className="text-[var(--text-muted)] mb-8">
                Here&apos;s your performance summary
              </p>

              {/* Results */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 rounded-2xl bg-[var(--bg-secondary)]"
                >
                  <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                    {answeredCount}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">Answered</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-2xl bg-[var(--success-bg)]"
                >
                  <div className="text-3xl font-bold text-[var(--success-text)] tabular-nums">
                    {correctCount}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">Correct</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-2xl bg-[var(--bg-accent-subtle)]"
                >
                  <div className="text-3xl font-bold text-[var(--text-accent)] tabular-nums">
                    {formatPercent(correctCount, answeredCount)}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">Score</div>
                </motion.div>
              </div>

              {/* Grade */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                {(() => {
                  const percentage = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;
                  let grade = { letter: "F", color: "text-[var(--error-text)]", bg: "bg-[var(--error-bg)]", message: "Keep practicing!" };

                  if (percentage >= 90) grade = { letter: "A", color: "text-[var(--success-text)]", bg: "bg-[var(--success-bg)]", message: "Outstanding!" };
                  else if (percentage >= 80) grade = { letter: "B", color: "text-[var(--success-text)]", bg: "bg-[var(--success-bg)]", message: "Great job!" };
                  else if (percentage >= 70) grade = { letter: "C", color: "text-[var(--text-accent)]", bg: "bg-[var(--bg-accent-subtle)]", message: "Good effort!" };
                  else if (percentage >= 60) grade = { letter: "D", color: "text-amber-500", bg: "bg-amber-500/10", message: "Room for improvement" };

                  return (
                    <div className={cn("inline-block px-8 py-4 rounded-2xl", grade.bg)}>
                      <div className={cn("text-6xl font-display font-bold mb-1", grade.color)}>
                        {grade.letter}
                      </div>
                      <p className={cn("text-sm font-medium", grade.color)}>{grade.message}</p>
                    </div>
                  );
                })()}
              </motion.div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  onClick={resetExam}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-primary px-8"
                >
                  Try Another Exam
                </motion.button>
                <Link href="/review" className="btn btn-ghost px-8">
                  Review Mistakes
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Keyboard listener component for reset shortcut
function KeyboardListener({ onReset, enabled }: { onReset: () => void; enabled: boolean }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "r" || e.key === "R") && enabled) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        onReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onReset, enabled]);

  return null;
}
