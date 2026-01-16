"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { QuestionCard } from "@/components/QuestionCard";
import {
  ProgressRing,
  QuestionNavigator,
} from "@/components/ui";
import { useQuiz } from "@/hooks/useQuiz";
import { startSession, recordQuestionAnswered } from "@/lib/stats";
import { playSoundIfEnabled } from "@/lib/sounds";
import { QuestionBank, QuestionType, Difficulty, QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from "@/types";
import { cn, formatPercent, shuffle } from "@/lib/utils";
import questionsData from "@/questions.json";

const questions = (questionsData as QuestionBank).questions;

type ExamState = "setup" | "running" | "finished";

interface ExamConfig {
  questionCount: number;
  timeLimit: number; // minutes
  questionTypes: QuestionType[];
  difficulties: Difficulty[];
}

const QUESTION_TYPES: QuestionType[] = ["mcq_single", "mcq_multi", "true_false", "emq", "cloze"];
const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4, 5];

export default function ExamPage() {
  // Exam state
  const [examState, setExamState] = useState<ExamState>("setup");
  const [config, setConfig] = useState<ExamConfig>({
    questionCount: 20,
    timeLimit: 30,
    questionTypes: [],
    difficulties: [],
  });

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

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

    const shuffled = shuffle(filtered);
    const selected = shuffled.slice(0, Math.min(config.questionCount, shuffled.length));
    return selected.map((item) => item.index);
  }, [config]);

  // Quiz hook
  const {
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
  } = useQuiz({
    questions,
    questionIndices: selectedIndices,
    shuffleQuestions: false,
  });

  // Track answers in stats
  const handleAnswer = (correct: boolean, answer: Parameters<typeof answerQuestion>[1]) => {
    answerQuestion(correct, answer);
    recordQuestionAnswered(correct, 0);
  };

  // Start exam
  const startExam = () => {
    const indices = generateExamQuestions();
    setSelectedIndices(indices);
    setTimeRemaining(config.timeLimit * 60);
    setExamState("running");
    startSession();
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

    return filtered.length;
  }, [config.questionTypes, config.difficulties]);

  // Timer color based on time remaining
  const timerColor = useMemo(() => {
    const percentage = timeRemaining / (config.timeLimit * 60);
    if (percentage > 0.5) return "text-[var(--text-primary)]";
    if (percentage > 0.2) return "text-amber-500";
    return "text-[var(--error-text)]";
  }, [timeRemaining, config.timeLimit]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Timer bar when running */}
      {examState === "running" && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40">
          <div className={cn("flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-[var(--border-subtle)] shadow-lg", timerColor)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono text-lg font-bold tabular-nums">
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Setup State */}
      {examState === "setup" && (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold text-[var(--text-primary)] mb-2">
              Exam Mode
            </h2>
            <p className="text-[var(--text-muted)]">
              Simulate a timed exam environment
            </p>
          </div>

          <div className="card p-6 space-y-6">
            {/* Question count */}
            <div>
              <label className="text-sm font-semibold text-[var(--text-muted)] mb-3 block">
                Number of Questions
              </label>
              <div className="flex flex-wrap gap-2">
                {[10, 20, 30, 50, availableCount].map((count) => (
                  <button
                    key={count}
                    onClick={() => setConfig((c) => ({ ...c, questionCount: Math.min(count, availableCount) }))}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      config.questionCount === Math.min(count, availableCount)
                        ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                    )}
                  >
                    {count === availableCount ? `All (${availableCount})` : count}
                  </button>
                ))}
              </div>
            </div>

            {/* Time limit */}
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
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      config.timeLimit === mins
                        ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                    )}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            {/* Question types filter */}
            <div>
              <label className="text-sm font-semibold text-[var(--text-muted)] mb-3 block">
                Question Types (optional)
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

            {/* Difficulty filter */}
            <div>
              <label className="text-sm font-semibold text-[var(--text-muted)] mb-3 block">
                Difficulty (optional)
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

            {/* Summary */}
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <p className="text-sm text-[var(--text-muted)] mb-4">
                {availableCount === 0 ? (
                  <span className="text-[var(--error-text)]">No questions match your filters</span>
                ) : (
                  <>
                    <strong>{Math.min(config.questionCount, availableCount)}</strong> questions in{" "}
                    <strong>{config.timeLimit}</strong> minutes
                    <span className="text-[var(--text-muted)]">
                      {" "}({Math.round((config.timeLimit * 60) / Math.min(config.questionCount, availableCount))}s per question)
                    </span>
                  </>
                )}
              </p>

              <button
                onClick={startExam}
                disabled={availableCount === 0}
                className={cn(
                  "btn w-full py-4 text-base font-semibold rounded-xl",
                  availableCount > 0 ? "btn-primary" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                )}
              >
                Start Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Running State */}
      {examState === "running" && (
        <div className="grid gap-8 lg:grid-cols-[1fr,320px] mt-8">
          <div className="space-y-6">
            {currentQuestion && (
              <QuestionCard
                key={currentIndex}
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                questionIndex={currentQuestionIndex}
                totalQuestions={totalQuestions}
                isAnswered={isAnswered}
                isCorrect={isCorrect}
                onAnswer={handleAnswer}
                onNext={nextQuestion}
                onPrevious={previousQuestion}
                canGoNext={currentIndex < totalQuestions - 1}
                canGoPrevious={currentIndex > 0}
                showBookmark={false}
              />
            )}

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
              <p className="text-center text-sm text-[var(--text-muted)]">
                {answeredCount} of {totalQuestions} answered
              </p>
            </div>

            {/* Finish button */}
            <button
              onClick={finishExam}
              className="btn btn-ghost w-full"
            >
              Finish Exam Early
            </button>
          </aside>
        </div>
      )}

      {/* Finished State */}
      {examState === "finished" && (
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-accent-subtle)] flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--text-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-2">
              Exam Complete!
            </h2>

            <p className="text-[var(--text-muted)] mb-8">
              Here&apos;s how you did
            </p>

            {/* Results */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
                <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                  {answeredCount}
                </div>
                <div className="text-xs text-[var(--text-muted)]">Answered</div>
              </div>
              <div className="p-4 rounded-xl bg-[var(--success-bg)]">
                <div className="text-3xl font-bold text-[var(--success-text)] tabular-nums">
                  {correctCount}
                </div>
                <div className="text-xs text-[var(--text-muted)]">Correct</div>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-accent-subtle)]">
                <div className="text-3xl font-bold text-[var(--text-accent)] tabular-nums">
                  {formatPercent(correctCount, answeredCount)}
                </div>
                <div className="text-xs text-[var(--text-muted)]">Score</div>
              </div>
            </div>

            {/* Grade */}
            <div className="mb-8">
              {(() => {
                const percentage = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;
                let grade = { letter: "F", color: "text-[var(--error-text)]", message: "Keep practicing!" };

                if (percentage >= 90) grade = { letter: "A", color: "text-[var(--success-text)]", message: "Excellent work!" };
                else if (percentage >= 80) grade = { letter: "B", color: "text-[var(--success-text)]", message: "Great job!" };
                else if (percentage >= 70) grade = { letter: "C", color: "text-[var(--text-accent)]", message: "Good effort!" };
                else if (percentage >= 60) grade = { letter: "D", color: "text-amber-500", message: "Keep studying!" };

                return (
                  <div>
                    <div className={cn("text-6xl font-display font-bold mb-2", grade.color)}>
                      {grade.letter}
                    </div>
                    <p className="text-[var(--text-muted)]">{grade.message}</p>
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={resetExam} className="btn btn-primary px-8">
                Try Another Exam
              </button>
              <Link href="/review" className="btn btn-ghost px-8">
                Review Mistakes
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
