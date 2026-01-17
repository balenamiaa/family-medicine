import { NextRequest, NextResponse } from "next/server";
import { db, studySets, StudySetType } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentUser, canViewSet, canEditSet, canDeleteSet, canCreateSetOfType, isAdmin } from "@/lib/auth";
import { toFrontendCard } from "@/lib/card-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/study-sets/[id] - Get a specific study set with cards
export async function GET(request: NextRequest, { params }: RouteParams) {
  const startedAt = Date.now();
  const { id } = await params;
  try {
    const user = await getCurrentUser(request);

    const studySet = await db.query.studySets.findFirst({
      where: eq(studySets.id, id),
      with: {
        cards: {
          orderBy: (cards, { asc }) => [asc(cards.orderIndex)],
        },
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    if (!studySet) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    // Check view permission
    if (!canViewSet(user, studySet)) {
      return NextResponse.json(
        { error: "You don't have permission to view this study set" },
        { status: 403 }
      );
    }

    // Include permission flags for the client
    // Transform cards to frontend format
    const cards = studySet.cards.map(toFrontendCard);

    return NextResponse.json({
      id: studySet.id,
      title: studySet.title,
      description: studySet.description,
      type: studySet.type,
      tags: studySet.tags,
      cardCount: cards.length,
      createdAt: studySet.createdAt,
      updatedAt: studySet.updatedAt,
      userId: studySet.userId,
      user: studySet.user,
      cards,
      _permissions: {
        canEdit: canEditSet(user, studySet),
        canDelete: canDeleteSet(user, studySet),
      },
    });
  } catch (error) {
    console.error("Failed to fetch study set:", error);
    return NextResponse.json(
      { error: "Failed to fetch study set" },
      { status: 500 }
    );
  } finally {
    console.info(`[api] GET /api/study-sets/${id} ${Date.now() - startedAt}ms`);
  }
}

// PATCH /api/study-sets/[id] - Update a study set
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the existing study set
    const existing = await db.query.studySets.findFirst({
      where: eq(studySets.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    // Check edit permission
    if (!canEditSet(user, existing)) {
      return NextResponse.json(
        { error: "You don't have permission to edit this study set" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, tags, type } = body;

    // If changing type, verify user can create that type
    if (type !== undefined && type !== existing.type) {
      if (!canCreateSetOfType(user, type as StudySetType)) {
        return NextResponse.json(
          { error: `You cannot change this set to type ${type}` },
          { status: 403 }
        );
      }
    }

    const [updated] = await db
      .update(studySets)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
        ...(type !== undefined && { type: type as StudySetType }),
        updatedAt: new Date(),
      })
      .where(eq(studySets.id, id))
      .returning();

    // Fetch updated study set with cards
    const studySet = await db.query.studySets.findFirst({
      where: eq(studySets.id, id),
      with: {
        cards: {
          orderBy: (cards, { asc }) => [asc(cards.orderIndex)],
        },
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    if (!studySet) {
      return NextResponse.json(updated);
    }

    return NextResponse.json({
      id: studySet.id,
      title: studySet.title,
      description: studySet.description,
      type: studySet.type,
      tags: studySet.tags,
      cardCount: studySet.cards.length,
      createdAt: studySet.createdAt,
      updatedAt: studySet.updatedAt,
      userId: studySet.userId,
      user: studySet.user,
      _permissions: {
        canEdit: canEditSet(user, studySet),
        canDelete: canDeleteSet(user, studySet),
      },
    });
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
    const user = await getCurrentUser(request);
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the existing study set
    const existing = await db.query.studySets.findFirst({
      where: eq(studySets.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    // Check delete permission
    if (!canDeleteSet(user, existing)) {
      return NextResponse.json(
        { error: "You don't have permission to delete this study set" },
        { status: 403 }
      );
    }

    await db
      .delete(studySets)
      .where(eq(studySets.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete study set:", error);
    return NextResponse.json(
      { error: "Failed to delete study set" },
      { status: 500 }
    );
  }
}
