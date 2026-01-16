import { NextRequest, NextResponse } from "next/server";
import { db, studySets } from "@/db";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/study-sets/[id] - Get a specific study set with cards
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const studySet = await db.query.studySets.findFirst({
      where: eq(studySets.id, id),
      with: {
        cards: {
          orderBy: (cards, { asc }) => [asc(cards.orderIndex)],
        },
      },
    });

    if (!studySet) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...studySet,
      _count: { cards: studySet.cards.length },
    });
  } catch (error) {
    console.error("Failed to fetch study set:", error);
    return NextResponse.json(
      { error: "Failed to fetch study set" },
      { status: 500 }
    );
  }
}

// PUT /api/study-sets/[id] - Update a study set
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, tags, isPublic } = body;

    const [studySet] = await db
      .update(studySets)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
        ...(isPublic !== undefined && { isPublic }),
        updatedAt: new Date(),
      })
      .where(eq(studySets.id, id))
      .returning();

    if (!studySet) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(studySet);
  } catch (error) {
    console.error("Failed to update study set:", error);
    return NextResponse.json(
      { error: "Failed to update study set" },
      { status: 500 }
    );
  }
}

// DELETE /api/study-sets/[id] - Delete a study set
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(studySets)
      .where(eq(studySets.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete study set:", error);
    return NextResponse.json(
      { error: "Failed to delete study set" },
      { status: 500 }
    );
  }
}
