import { CardType, Difficulty } from "@/db";
import { QuestionType, Difficulty as FrontendDifficulty } from "@/types";

// Map frontend question types to database card types
export const questionTypeToCardType: Record<QuestionType, CardType> = {
  mcq_single: "MCQ_SINGLE",
  mcq_multi: "MCQ_MULTI",
  true_false: "TRUE_FALSE",
  emq: "EMQ",
  cloze: "CLOZE",
  written: "WRITTEN",
};

// Map database card types to frontend question types
export const cardTypeToQuestionType: Record<CardType, QuestionType | null> = {
  MCQ_SINGLE: "mcq_single",
  MCQ_MULTI: "mcq_multi",
  TRUE_FALSE: "true_false",
  EMQ: "emq",
  CLOZE: "cloze",
  NOTE: null, // No frontend equivalent
  SBA: "mcq_single", // Treat as MCQ single
  WRITTEN: "written",
};

// Map numeric difficulty to database enum
export function numericToDifficulty(num: number): Difficulty {
  const safe = Math.max(1, Math.min(5, Math.round(num)));
  if (safe <= 2) return "EASY";
  if (safe <= 3) return "MEDIUM";
  return "HARD";
}

// Map database difficulty enum to numeric
export function difficultyToNumeric(diff: Difficulty): FrontendDifficulty {
  switch (diff) {
    case "EASY": return 2;
    case "MEDIUM": return 3;
    case "HARD": return 4;
    default: return 3;
  }
}

// Transform database card to frontend format
export function toFrontendCard(dbCard: {
  id: string;
  cardType: CardType;
  content: unknown;
  difficulty: Difficulty;
  orderIndex: number;
  tags?: string[] | null;
}) {
  const questionType = cardTypeToQuestionType[dbCard.cardType];
  const content = (dbCard.content as Record<string, unknown> | null) ?? {};
  const { _difficulty, ...questionData } = content;
  const storedDifficulty = typeof _difficulty === "number"
    ? Math.max(1, Math.min(5, Math.round(_difficulty)))
    : null;

  return {
    id: dbCard.id,
    questionType: questionType ?? dbCard.cardType.toLowerCase(),
    questionData,
    difficulty: (storedDifficulty ?? difficultyToNumeric(dbCard.difficulty)) as FrontendDifficulty,
    orderIndex: dbCard.orderIndex,
    explanation: (content?.explanation as string) ?? "",
    retentionAid: (content?.retention_aid as string) ?? "",
    tags: dbCard.tags ?? [],
  };
}

// Transform frontend card data to database format
export function toDatabaseCard(frontendData: {
  studySetId: string;
  questionType: string;
  questionData?: Record<string, unknown>;
  difficulty?: number;
  orderIndex?: number;
  tags?: string[];
}) {
  const difficultyValue = typeof frontendData.difficulty === "number"
    ? Math.max(1, Math.min(5, Math.round(frontendData.difficulty)))
    : 3;
  const content: Record<string, unknown> = {
    ...(frontendData.questionData ?? {}),
    _difficulty: difficultyValue,
  };
  const cardType = questionTypeToCardType[frontendData.questionType as QuestionType]
    ?? (frontendData.questionType.toUpperCase() as CardType);

  return {
    studySetId: frontendData.studySetId,
    cardType,
    content,
    difficulty: numericToDifficulty(difficultyValue),
    orderIndex: frontendData.orderIndex ?? 0,
    tags: frontendData.tags ?? [],
  };
}
