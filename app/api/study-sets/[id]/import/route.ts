import { NextRequest, NextResponse } from "next/server";
import { db, studyCards, studySets } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentUser, canEditSet } from "@/lib/auth";
import { toDatabaseCard, toFrontendCard } from "@/lib/card-utils";
import { QuestionType } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ImportedQuestion {
  question_type: QuestionType;
  difficulty?: number;
  explanation?: string;
  retention_aid?: string;
  // MCQ fields
  question_text?: string;
  options?: string[];
  correct_index?: number;
  correct_indices?: number[];
  // True/False fields
  is_correct_true?: boolean;
  // EMQ fields
  instructions?: string;
  premises?: string[];
  matches?: [number, number][];
  // Cloze fields
  answers?: string[];
  // Written fields
  correct_answer?: string;
}

// Validate a single question
function validateQuestion(q: ImportedQuestion, index: number): string | null {
  if (!q.question_type) {
    return `Question ${index + 1}: missing question_type`;
  }

  const validTypes: QuestionType[] = ["mcq_single", "mcq_multi", "true_false", "emq", "cloze", "written"];
  if (!validTypes.includes(q.question_type)) {
    return `Question ${index + 1}: invalid question_type "${q.question_type}"`;
  }

  switch (q.question_type) {
    case "mcq_single":
      if (!q.question_text) return `Question ${index + 1}: missing question_text`;
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return `Question ${index + 1}: options must be an array with at least 2 items`;
      }
      if (q.correct_index === undefined || q.correct_index < 0 || q.correct_index >= q.options.length) {
        return `Question ${index + 1}: correct_index must be a valid index`;
      }
      break;

    case "mcq_multi":
      if (!q.question_text) return `Question ${index + 1}: missing question_text`;
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return `Question ${index + 1}: options must be an array with at least 2 items`;
      }
      if (!Array.isArray(q.correct_indices) || q.correct_indices.length === 0) {
        return `Question ${index + 1}: correct_indices must be a non-empty array`;
      }
      break;

    case "true_false":
      if (!q.question_text) return `Question ${index + 1}: missing question_text`;
      if (typeof q.is_correct_true !== "boolean") {
        return `Question ${index + 1}: is_correct_true must be true or false`;
      }
      break;

    case "emq":
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return `Question ${index + 1}: options must be an array with at least 2 items`;
      }
      if (!Array.isArray(q.premises) || q.premises.length === 0) {
        return `Question ${index + 1}: premises must be a non-empty array`;
      }
      if (!Array.isArray(q.matches) || q.matches.length === 0) {
        return `Question ${index + 1}: matches must be a non-empty array of [premise_index, option_index] pairs`;
      }
      break;

    case "cloze":
      if (!q.question_text) return `Question ${index + 1}: missing question_text`;
      if (!Array.isArray(q.answers) || q.answers.length === 0) {
        return `Question ${index + 1}: answers must be a non-empty array`;
      }
      break;
    case "written":
      if (!q.question_text) return `Question ${index + 1}: missing question_text`;
      if (!q.correct_answer) return `Question ${index + 1}: correct_answer is required`;
      break;
  }

  return null;
}

// Convert imported question to database format
function questionToDbFormat(q: ImportedQuestion): Record<string, unknown> {
  const base = {
    explanation: q.explanation ?? "",
    retention_aid: q.retention_aid ?? "",
  };

  switch (q.question_type) {
    case "mcq_single":
      return {
        ...base,
        question_text: q.question_text,
        options: q.options,
        correct_index: q.correct_index,
      };
    case "mcq_multi":
      return {
        ...base,
        question_text: q.question_text,
        options: q.options,
        correct_indices: q.correct_indices,
      };
    case "true_false":
      return {
        ...base,
        question_text: q.question_text,
        is_correct_true: q.is_correct_true,
      };
    case "emq":
      return {
        ...base,
        instructions: q.instructions ?? "",
        options: q.options,
        premises: q.premises,
        matches: q.matches,
      };
    case "cloze":
      return {
        ...base,
        question_text: q.question_text,
        answers: q.answers,
      };
    case "written":
      return {
        ...base,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
      };
    default:
      return base;
  }
}

// POST /api/study-sets/[id]/import - Import questions from JSON
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    const { id: studySetId } = await params;

    // Check if user can edit the study set
    const set = await db.query.studySets.findFirst({
      where: eq(studySets.id, studySetId),
      with: {
        cards: {
          columns: { orderIndex: true },
          orderBy: (cards, { desc }) => [desc(cards.orderIndex)],
          limit: 1,
        },
      },
    });

    if (!set) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    if (!canEditSet(user, set)) {
      return NextResponse.json(
        { error: "You don't have permission to edit this study set" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { questions, mode = "append" } = body;

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: "questions must be an array" },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "questions array is empty" },
        { status: 400 }
      );
    }

    // Validate all questions
    const errors: string[] = [];
    for (let i = 0; i < questions.length; i++) {
      const error = validateQuestion(questions[i], i);
      if (error) errors.push(error);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    // Get the starting order index
    let startIndex = 0;
    if (mode === "append" && set.cards.length > 0) {
      startIndex = (set.cards[0].orderIndex ?? 0) + 1;
    } else if (mode === "replace") {
      // Delete existing cards
      await db.delete(studyCards).where(eq(studyCards.studySetId, studySetId));
    }

    // Prepare cards for insertion
    const cardsToInsert = questions.map((q: ImportedQuestion, i: number) => {
      const dbData = toDatabaseCard({
        studySetId,
        questionType: q.question_type,
        questionData: questionToDbFormat(q),
        difficulty: q.difficulty ?? 3,
        orderIndex: startIndex + i,
      });
      return dbData;
    });

    // Insert cards
    const insertedCards = await db
      .insert(studyCards)
      .values(cardsToInsert)
      .returning();

    // Transform to frontend format
    const frontendCards = insertedCards.map(toFrontendCard);

    return NextResponse.json({
      success: true,
      imported: frontendCards.length,
      cards: frontendCards,
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to import cards:", error);
    return NextResponse.json(
      { error: "Failed to import cards" },
      { status: 500 }
    );
  }
}
