import { CardType, Difficulty } from "@/db";
import { QuestionType, Difficulty as FrontendDifficulty } from "@/types";

// Map frontend question types to database card types
export const questionTypeToCardType: Record<QuestionType, CardType> = {
  mcq_single: "MCQ_SINGLE",
  mcq_multi: "MCQ_MULTI",
  true_false: "TRUE_FALSE",
  emq: "EMQ",
  cloze: "CLOZE",
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
  WRITTEN: null, // No frontend equivalent
};

// Map numeric difficulty to database enum
export function numericToDifficulty(num: FrontendDifficulty): Difficulty {
  if (num <= 2) return "EASY";
  if (num <= 3) return "MEDIUM";
  return "HARD";
}

// Map database difficulty enum to numeric
export function difficultyToNumeric(diff: Difficulty): FrontendDifficulty {
  switch (diff) {
    case "EASY": return 2;
    case "MEDIUM": return 3;
    case "HARD": return 4;
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
  const content = dbCard.content as Record<string, unknown> | null;

  return {
    id: dbCard.id,
    questionType: questionType ?? dbCard.cardType.toLowerCase(),
    questionData: content ?? {},
    difficulty: difficultyToNumeric(dbCard.difficulty),
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
  const cardType = questionTypeToCardType[frontendData.questionType as QuestionType]
    ?? (frontendData.questionType.toUpperCase() as CardType);

  return {
    studySetId: frontendData.studySetId,
    cardType,
    content: frontendData.questionData ?? {},
    difficulty: numericToDifficulty((frontendData.difficulty ?? 3) as FrontendDifficulty),
    orderIndex: frontendData.orderIndex ?? 0,
    tags: frontendData.tags ?? [],
  };
}
