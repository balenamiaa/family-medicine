import { NextRequest, NextResponse } from "next/server";
import { db, studyCards, studySets } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentUser, canEditSet, canViewSet } from "@/lib/auth";
import { toFrontendCard, numericToDifficulty } from "@/lib/card-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cards/[id] - Get a specific card
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format");

    const card = await db.query.studyCards.findFirst({
      where: eq(studyCards.id, id),
      with: {
        studySet: true,
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    if (!canViewSet(user, card.studySet)) {
      return NextResponse.json(
        { error: "You don't have permission to view this card" },
        { status: 403 }
      );
    }

    const response = format === "frontend" ? toFrontendCard(card) : card;
    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch card:", error);
    return NextResponse.json(
      { error: "Failed to fetch card" },
      { status: 500 }
    );
  }
}

// Helper to get card with permission check
async function getCardWithPermission(request: NextRequest, id: string) {
  const user = await getCurrentUser(request);

  const card = await db.query.studyCards.findFirst({
    where: eq(studyCards.id, id),
    with: {
      studySet: true,
    },
  });

  if (!card) {
    return { error: "Card not found", status: 404 };
  }

  if (!canEditSet(user, card.studySet)) {
    return { error: "You don't have permission to edit this card", status: 403 };
  }

  return { card };
}

// PATCH /api/cards/[id] - Partial update a card (preferred for frontend)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await getCardWithPermission(request, id);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    let nextContent: Record<string, unknown> | null = null;

    // Support both frontend and database field names
    if ("questionData" in body) {
      nextContent = { ...(body.questionData as Record<string, unknown>) };
    } else if ("content" in body) {
      nextContent = { ...(body.content as Record<string, unknown>) };
    }

    if ("difficulty" in body) {
      // Handle numeric difficulty from frontend
      if (typeof body.difficulty === "number") {
        updates.difficulty = numericToDifficulty(body.difficulty);
        if (nextContent) {
          nextContent._difficulty = body.difficulty;
        }
      } else {
        updates.difficulty = body.difficulty;
      }
    }

    if (nextContent) {
      updates.content = nextContent;
    }

    if ("tags" in body) updates.tags = body.tags;
    if ("orderIndex" in body) updates.orderIndex = body.orderIndex;

    const [card] = await db
      .update(studyCards)
      .set(updates)
      .where(eq(studyCards.id, id))
      .returning();

    // Return in frontend format
    return NextResponse.json(toFrontendCard(card));
  } catch (error) {
    console.error("Failed to update card:", error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}

// PUT /api/cards/[id] - Full update a card (legacy support)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await getCardWithPermission(request, id);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const body = await request.json();
    const { content, difficulty, tags, orderIndex } = body;
    const resolvedDifficulty = typeof difficulty === "number"
      ? numericToDifficulty(difficulty)
      : difficulty;
    const resolvedContent = typeof difficulty === "number" && typeof content === "object"
      ? { ...(content as Record<string, unknown>), _difficulty: difficulty }
      : content;

    const [card] = await db
      .update(studyCards)
      .set({
        ...(resolvedContent !== undefined && { content: resolvedContent }),
        ...(resolvedDifficulty !== undefined && { difficulty: resolvedDifficulty }),
        ...(tags !== undefined && { tags }),
        ...(orderIndex !== undefined && { orderIndex }),
        updatedAt: new Date(),
      })
      .where(eq(studyCards.id, id))
      .returning();

    if (!card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Failed to update card:", error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}

// DELETE /api/cards/[id] - Delete a card
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await getCardWithPermission(request, id);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const [deleted] = await db
      .delete(studyCards)
      .where(eq(studyCards.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete card:", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 }
    );
  }
}
