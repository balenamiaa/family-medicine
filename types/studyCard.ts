// Type definitions for polymorphic study card content
// These types match the JSONB content stored in the database

// Base content fields shared by some card types
interface BaseQuestionContent {
  explanation?: string;
  retentionAid?: string;
}

// Note card - Markdown content for reading/recall
export interface NoteContent {
  title: string;
  content: string; // Markdown
}

// MCQ Single - Multiple choice with single correct answer
export interface McqSingleContent extends BaseQuestionContent {
  questionText: string;
  options: string[];
  correctIndex: number;
}

// MCQ Multi - Multiple choice with multiple correct answers
export interface McqMultiContent extends BaseQuestionContent {
  questionText: string;
  options: string[];
  correctIndices: number[];
}

// True/False - Statement with true/false answer
export interface TrueFalseContent extends BaseQuestionContent {
  statement: string;
  isTrue: boolean;
}

// SBA - Single Best Answer (clinical vignette style)
export interface SbaContent extends BaseQuestionContent {
  stem: string; // Clinical vignette
  leadIn: string; // Question lead-in
  options: string[];
  correctIndex: number;
}

// Cloze - Fill in the blanks
// Blanks are marked with {{blank}} in the text
export interface ClozeContent extends BaseQuestionContent {
  text: string; // Text with {{blank}} markers
  answers: string[]; // Correct answers for each blank
}

// EMQ - Extended Matching Questions
export interface EmqContent extends BaseQuestionContent {
  theme: string;
  options: string[]; // Shared option list
  items: Array<{
    stem: string;
    correctIndex: number;
  }>;
}

// Written - Free-form answer with keywords
export interface WrittenContent extends BaseQuestionContent {
  question: string;
  sampleAnswer: string;
  keywords: string[]; // Key terms to look for in response
}

// Union type for all content types
export type StudyCardContent =
  | NoteContent
  | McqSingleContent
  | McqMultiContent
  | TrueFalseContent
  | SbaContent
  | ClozeContent
  | EmqContent
  | WrittenContent;

// Card type enum matching Prisma schema
export type CardType =
  | "NOTE"
  | "MCQ_SINGLE"
  | "MCQ_MULTI"
  | "TRUE_FALSE"
  | "SBA"
  | "CLOZE"
  | "EMQ"
  | "WRITTEN";

// Difficulty enum matching Prisma schema
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

// Type guards for content
export function isNoteContent(content: StudyCardContent): content is NoteContent {
  return "title" in content && "content" in content && !("questionText" in content);
}

export function isMcqSingleContent(content: StudyCardContent): content is McqSingleContent {
  return "questionText" in content && "options" in content && "correctIndex" in content && !("correctIndices" in content);
}

export function isMcqMultiContent(content: StudyCardContent): content is McqMultiContent {
  return "questionText" in content && "correctIndices" in content;
}

export function isTrueFalseContent(content: StudyCardContent): content is TrueFalseContent {
  return "statement" in content && "isTrue" in content;
}

export function isSbaContent(content: StudyCardContent): content is SbaContent {
  return "stem" in content && "leadIn" in content;
}

export function isClozeContent(content: StudyCardContent): content is ClozeContent {
  return "text" in content && "answers" in content && !("title" in content);
}

export function isEmqContent(content: StudyCardContent): content is EmqContent {
  return "theme" in content && "items" in content;
}

export function isWrittenContent(content: StudyCardContent): content is WrittenContent {
  return "question" in content && "sampleAnswer" in content && "keywords" in content;
}

// Helper to map old question type to new CardType
export function mapLegacyQuestionType(type: string): CardType {
  const mapping: Record<string, CardType> = {
    mcq_single: "MCQ_SINGLE",
    mcq_multi: "MCQ_MULTI",
    true_false: "TRUE_FALSE",
    emq: "EMQ",
    cloze: "CLOZE",
  };
  return mapping[type] ?? "MCQ_SINGLE";
}

// Helper to map old difficulty to new Difficulty
export function mapLegacyDifficulty(difficulty: number): Difficulty {
  if (difficulty <= 2) return "EASY";
  if (difficulty >= 4) return "HARD";
  return "MEDIUM";
}
