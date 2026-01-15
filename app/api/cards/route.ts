import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CardType, Difficulty } from "@/lib/generated/prisma";

// GET /api/cards - List cards (optionally filtered by studySetId)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studySetId = searchParams.get("studySetId");
    const cardType = searchParams.get("cardType") as CardType | null;
    const difficulty = searchParams.get("difficulty") as Difficulty | null;
    const limit = parseInt(searchParams.get("limit") ?? "100");
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const cards = await prisma.studyCard.findMany({
      where: {
        ...(studySetId && { studySetId }),
        ...(cardType && { cardType }),
        ...(difficulty && { difficulty }),
      },
      orderBy: { orderIndex: "asc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.studyCard.count({
      where: {
        ...(studySetId && { studySetId }),
        ...(cardType && { cardType }),
        ...(difficulty && { difficulty }),
      },
    });

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

    const card = await prisma.studyCard.create({
      data: {
        studySetId,
        cardType,
        content,
        difficulty: difficulty ?? Difficulty.MEDIUM,
        tags: tags ?? [],
        orderIndex: orderIndex ?? 0,
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("Failed to create card:", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }
}

// POST /api/cards/bulk - Create multiple cards at once
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

    const result = await prisma.studyCard.createMany({
      data: cards.map((card: any) => ({
        studySetId: card.studySetId,
        cardType: card.cardType,
        content: card.content,
        difficulty: card.difficulty ?? Difficulty.MEDIUM,
        tags: card.tags ?? [],
        orderIndex: card.orderIndex ?? 0,
      })),
    });

    return NextResponse.json({ created: result.count }, { status: 201 });
  } catch (error) {
    console.error("Failed to bulk create cards:", error);
    return NextResponse.json(
      { error: "Failed to bulk create cards" },
      { status: 500 }
    );
  }
}
