"use client";

import { useState } from "react";
import { MCQSingleQuestion, MCQMultiQuestion } from "@/types";
import { OptionButton } from "./OptionButton";
import { cn } from "@/lib/utils";

interface MCQQuestionProps {
  question: MCQSingleQuestion | MCQMultiQuestion;
  onAnswer: (correct: boolean, answer: number | number[]) => void;
  answered: boolean;
}

export function MCQQuestion({ question, onAnswer, answered }: MCQQuestionProps) {
  const isMulti = question.question_type === "mcq_multi";
  const correctIndices = isMulti
    ? (question as MCQMultiQuestion).correct_indices
    : [(question as MCQSingleQuestion).correct_index];

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleSelect = (index: number) => {
    if (answered) return;

    if (isMulti) {
      setSelectedIndices((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      setSelectedIndices([index]);
    }
  };

  const handleSubmit = () => {
    if (selectedIndices.length === 0) return;

    const isCorrect = isMulti
      ? correctIndices.length === selectedIndices.length &&
        correctIndices.every((i) => selectedIndices.includes(i))
      : selectedIndices[0] === correctIndices[0];

    onAnswer(isCorrect, isMulti ? selectedIndices : selectedIndices[0]);
  };

  const getOptionState = (index: number): boolean | null => {
    if (!answered) return null;
    return correctIndices.includes(index);
  };

  return (
    <div className="space-y-6">
      {/* Question text */}
      <div className="space-y-2">
        <p className="text-lg leading-relaxed text-[var(--text-primary)]">
          {question.question_text}
        </p>
        {isMulti && (
          <p className="text-sm text-[var(--text-muted)] italic">
            Select all that apply
          </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3 stagger-children">
        {question.options.map((option, index) => (
          <OptionButton
            key={index}
            label={option}
            index={index}
            selected={selectedIndices.includes(index)}
            correct={getOptionState(index)}
            disabled={answered}
            multiSelect={isMulti}
            onClick={() => handleSelect(index)}
          />
        ))}
      </div>

      {/* Submit button */}
      {!answered && (
        <button
          onClick={handleSubmit}
          disabled={selectedIndices.length === 0}
          className={cn(
            "btn w-full py-4 text-base font-semibold rounded-xl transition-all duration-200",
            selectedIndices.length > 0
              ? "btn-primary"
              : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
          )}
        >
          {isMulti
            ? `Submit (${selectedIndices.length} selected)`
            : "Check Answer"}
        </button>
      )}
    </div>
  );
}
