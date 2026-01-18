import { NextRequest, NextResponse } from "next/server";
import { db, studyCards, studySets, CardType, Difficulty } from "@/db";
import { eq, and, asc, count } from "drizzle-orm";
import { getCurrentUser, canEditSet, canViewSet } from "@/lib/auth";
import { numericToDifficulty } from "@/lib/card-utils";
import { toFrontendCard, toDatabaseCard } from "@/lib/card-utils";

// GET /api/cards - List cards (optionally filtered by studySetId)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const searchParams = request.nextUrl.searchParams;
    const studySetId = searchParams.get("studySetId");
    const cardType = searchParams.get("cardType") as CardType | null;
    const difficulty = searchParams.get("difficulty") as Difficulty | null;
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "100", 10);
    const offsetParam = Number.parseInt(searchParams.get("offset") ?? "0", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 100;
    const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
    const format = searchParams.get("format"); // "frontend" for transformed data

    if (!studySetId) {
      return NextResponse.json(
        { error: "studySetId is required" },
        { status: 400 }
      );
    }

    const set = await db.query.studySets.findFirst({
      where: eq(studySets.id, studySetId),
    });

    if (!set) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    if (!canViewSet(user, set)) {
      return NextResponse.json(
        { error: "You don't have permission to view this study set" },
        { status: 403 }
      );
    }

    // Build where conditions
    const conditions = [];
    if (studySetId) conditions.push(eq(studyCards.studySetId, studySetId));
    if (cardType) conditions.push(eq(studyCards.cardType, cardType));
    if (difficulty) conditions.push(eq(studyCards.difficulty, difficulty));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const cards = await db
      .select()
      .from(studyCards)
      .where(whereClause)
      .orderBy(asc(studyCards.orderIndex))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(studyCards)
      .where(whereClause);

    // Transform to frontend format if requested
    const responseCards = format === "frontend"
      ? cards.map(toFrontendCard)
      : cards;

    return NextResponse.json({ cards: responseCards, total, limit, offset });
  } catch (error) {
    console.error("Failed to fetch cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}

// POST /api/cards - Create a new card
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const body = await request.json();

    // Support both frontend format (questionType/questionData) and database format (cardType/content)
    const studySetId = body.studySetId;
    const hasQuestionType = "questionType" in body;

    if (!studySetId) {
      return NextResponse.json(
        { error: "studySetId is required" },
        { status: 400 }
      );
    }

    // Check if user can edit the study set
    const set = await db.query.studySets.findFirst({
      where: eq(studySets.id, studySetId),
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

    let insertData;
    if (hasQuestionType) {
      // Frontend format
      insertData = toDatabaseCard({
        studySetId,
        questionType: body.questionType,
        questionData: body.questionData,
        difficulty: body.difficulty,
        orderIndex: body.orderIndex,
        tags: body.tags,
      });
    } else {
      // Database format
      const { cardType, content, difficulty, tags, orderIndex } = body;
      if (!cardType || !content) {
        return NextResponse.json(
          { error: "cardType and content are required" },
          { status: 400 }
        );
      }
      const resolvedDifficulty = typeof difficulty === "number"
        ? numericToDifficulty(difficulty)
        : (difficulty ?? "MEDIUM");
      const resolvedContent = typeof difficulty === "number" && typeof content === "object"
        ? { ...(content as Record<string, unknown>), _difficulty: difficulty }
        : content;
      insertData = {
        studySetId,
        cardType,
        content: resolvedContent,
        difficulty: resolvedDifficulty,
        tags: tags ?? [],
        orderIndex: orderIndex ?? 0,
      };
    }

    const [card] = await db
      .insert(studyCards)
      .values(insertData)
      .returning();

    // Return in frontend format if created with frontend format
    const response = hasQuestionType ? toFrontendCard(card) : card;
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to create card:", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }
}

// PUT /api/cards/bulk - Create multiple cards at once
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { cards, studySetId } = body;

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: "cards array is required" },
        { status: 400 }
      );
    }

    // Verify permission if studySetId provided
    if (studySetId) {
      const set = await db.query.studySets.findFirst({
        where: eq(studySets.id, studySetId),
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
    }

    const insertedCards = await db
      .insert(studyCards)
      .values(
        cards.map((card: any) => ({
          studySetId: card.studySetId || studySetId,
          cardType: card.cardType,
          content: typeof card.difficulty === "number" && typeof card.content === "object"
            ? { ...(card.content as Record<string, unknown>), _difficulty: card.difficulty }
            : card.content,
          difficulty: typeof card.difficulty === "number"
            ? numericToDifficulty(card.difficulty)
            : (card.difficulty ?? "MEDIUM"),
          tags: card.tags ?? [],
          orderIndex: card.orderIndex ?? 0,
        }))
      )
      .returning();

    return NextResponse.json({ created: insertedCards.length }, { status: 201 });
  } catch (error) {
    console.error("Failed to bulk create cards:", error);
    return NextResponse.json(
      { error: "Failed to bulk create cards" },
      { status: 500 }
    );
  }
}
