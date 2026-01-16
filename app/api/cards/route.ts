import { NextRequest, NextResponse } from "next/server";
import { db, studyCards, CardType, Difficulty } from "@/db";
import { eq, and, asc, count } from "drizzle-orm";

// GET /api/cards - List cards (optionally filtered by studySetId)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studySetId = searchParams.get("studySetId");
    const cardType = searchParams.get("cardType") as CardType | null;
    const difficulty = searchParams.get("difficulty") as Difficulty | null;
    const limit = parseInt(searchParams.get("limit") ?? "100");
    const offset = parseInt(searchParams.get("offset") ?? "0");

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

    return NextResponse.json({ cards, total, limit, offset });
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
    const body = await request.json();
    const { studySetId, cardType, content, difficulty, tags, orderIndex } = body;

    if (!studySetId || !cardType || !content) {
      return NextResponse.json(
        { error: "studySetId, cardType, and content are required" },
        { status: 400 }
      );
    }

    const [card] = await db
      .insert(studyCards)
      .values({
        studySetId,
        cardType,
        content,
        difficulty: difficulty ?? "MEDIUM",
        tags: tags ?? [],
        orderIndex: orderIndex ?? 0,
      })
      .returning();

    return NextResponse.json(card, { status: 201 });
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
    const body = await request.json();
    const { cards } = body;

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: "cards array is required" },
        { status: 400 }
      );
    }

    const insertedCards = await db
      .insert(studyCards)
      .values(
        cards.map((card: any) => ({
          studySetId: card.studySetId,
          cardType: card.cardType,
          content: card.content,
          difficulty: card.difficulty ?? "MEDIUM",
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
