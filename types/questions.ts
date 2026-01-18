// Question type discriminated union for type-safe handling

export type QuestionType =
  | "mcq_single"
  | "mcq_multi"
  | "true_false"
  | "emq"
  | "cloze"
  | "written";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

// Base question interface with common fields
interface BaseQuestion {
  difficulty: Difficulty;
  retention_aid: string;
  explanation: string;
  id?: string;
  tags?: string[];
}

// Single-choice MCQ
export interface MCQSingleQuestion extends BaseQuestion {
  question_type: "mcq_single";
  question_text: string;
  options: string[];
  correct_index: number;
}

// Multiple-choice MCQ
export interface MCQMultiQuestion extends BaseQuestion {
  question_type: "mcq_multi";
  question_text: string;
  options: string[];
  correct_indices: number[];
}

// True/False question
export interface TrueFalseQuestion extends BaseQuestion {
  question_type: "true_false";
  question_text: string;
  is_correct_true: boolean;
}

// Extended Matching Question
export interface EMQQuestion extends BaseQuestion {
  question_type: "emq";
  instructions: string;
  premises: string[];
  options: string[];
  matches: [number, number][]; // [premise_index, option_index]
}

// Cloze (fill-in-the-blank) question
export interface ClozeQuestion extends BaseQuestion {
  question_type: "cloze";
  question_text: string; // Contains {1}, {2}, etc. placeholders
  answers: string[];
}

// Written response question
export interface WrittenQuestion extends BaseQuestion {
  question_type: "written";
  question_text: string;
  correct_answer: string;
}

// Union type for all question types
export type Question =
  | MCQSingleQuestion
  | MCQMultiQuestion
  | TrueFalseQuestion
  | EMQQuestion
  | ClozeQuestion
  | WrittenQuestion;

// Question bank structure
export interface QuestionBank {
  questions: Question[];
}

// User answer types
export type MCQAnswer = number | null;
export type MCQMultiAnswer = number[];
export type TrueFalseAnswer = boolean | null;
export type EMQAnswer = Record<number, number | null>; // premise_index -> option_index
export type ClozeAnswer = string[];
export type WrittenAnswer = string;

export type UserAnswer =
  | MCQAnswer
  | MCQMultiAnswer
  | TrueFalseAnswer
  | EMQAnswer
  | ClozeAnswer
  | WrittenAnswer;

// Question state for tracking user progress
export interface QuestionState {
  questionIndex: number;
  answered: boolean;
  correct: boolean | null;
  userAnswer: UserAnswer;
  showExplanation: boolean;
  feedbackGiven?: boolean;
}

// Session progress
export interface SessionProgress {
  currentIndex: number;
  answered: number;
  correct: number;
  streak: number;
  maxStreak: number;
  questionStates: Record<number, QuestionState>;
}

// Type guards for question types
export function isMCQSingle(q: Question): q is MCQSingleQuestion {
  return q.question_type === "mcq_single";
}

export function isMCQMulti(q: Question): q is MCQMultiQuestion {
  return q.question_type === "mcq_multi";
}

export function isTrueFalse(q: Question): q is TrueFalseQuestion {
  return q.question_type === "true_false";
}

export function isEMQ(q: Question): q is EMQQuestion {
  return q.question_type === "emq";
}

export function isCloze(q: Question): q is ClozeQuestion {
  return q.question_type === "cloze";
}

export function isWritten(q: Question): q is WrittenQuestion {
  return q.question_type === "written";
}

// Difficulty labels
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: "Basic",
  2: "Easy",
  3: "Moderate",
  4: "Challenging",
  5: "Expert",
};

// Question type labels
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq_single: "Single Choice",
  mcq_multi: "Multiple Choice",
  true_false: "True/False",
  emq: "Extended Matching",
  cloze: "Fill in the Blank",
  written: "Written Response",
};
