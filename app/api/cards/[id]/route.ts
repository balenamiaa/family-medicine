import { NextRequest, NextResponse } from "next/server";
import { db, studyCards } from "@/db";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cards/[id] - Get a specific card
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const card = await db.query.studyCards.findFirst({
      where: eq(studyCards.id, id),
      with: {
        studySet: {
          columns: { id: true, title: true },
        },
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Failed to fetch card:", error);
    return NextResponse.json(
      { error: "Failed to fetch card" },
      { status: 500 }
    );
  }
}

// PUT /api/cards/[id] - Update a card
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, difficulty, tags, orderIndex } = body;

    const [card] = await db
      .update(studyCards)
      .set({
        ...(content !== undefined && { content }),
        ...(difficulty !== undefined && { difficulty }),
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
