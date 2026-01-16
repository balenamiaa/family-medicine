import { NextRequest, NextResponse } from "next/server";
import { db, studyCards, studySets } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { getCurrentUser, canEditSet } from "@/lib/auth";

// POST /api/cards/reorder - Reorder cards in a study set
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();
    const { studySetId, cardIds } = body;

    if (!studySetId || !Array.isArray(cardIds)) {
      return NextResponse.json(
        { error: "studySetId and cardIds array are required" },
        { status: 400 }
      );
    }

    // Check permission
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

    // Verify all cards belong to this study set
    const existingCards = await db
      .select({ id: studyCards.id })
      .from(studyCards)
      .where(eq(studyCards.studySetId, studySetId));

    const existingIds = new Set(existingCards.map(c => c.id));
    const invalidIds = cardIds.filter((id: string) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Cards not found in this study set: ${invalidIds.join(", ")}` },
        { status: 400 }
      );
    }

    // Update order indices
    const updates = cardIds.map((id: string, index: number) =>
      db
        .update(studyCards)
        .set({ orderIndex: index, updatedAt: new Date() })
        .where(eq(studyCards.id, id))
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true, reordered: cardIds.length });
  } catch (error) {
    console.error("Failed to reorder cards:", error);
    return NextResponse.json(
      { error: "Failed to reorder cards" },
      { status: 500 }
    );
  }
}
