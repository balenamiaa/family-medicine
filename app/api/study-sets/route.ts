import { NextRequest, NextResponse } from "next/server";
import { db, studySets } from "@/db";
import { eq, desc } from "drizzle-orm";

// GET /api/study-sets - List all study sets
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    const results = await db.query.studySets.findMany({
      where: userId ? eq(studySets.userId, userId) : undefined,
      with: {
        cards: true,
      },
      orderBy: [desc(studySets.updatedAt)],
    });

    // Add card count to each result
    const withCounts = results.map((set) => ({
      ...set,
      _count: { cards: set.cards.length },
      cards: undefined, // Don't include full cards in list
    }));

    return NextResponse.json(withCounts);
  } catch (error) {
    console.error("Failed to fetch study sets:", error);
    return NextResponse.json(
      { error: "Failed to fetch study sets" },
      { status: 500 }
    );
  }
}

// POST /api/study-sets - Create a new study set
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, tags, isPublic } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { error: "userId and title are required" },
        { status: 400 }
      );
    }

    const [studySet] = await db
      .insert(studySets)
      .values({
        userId,
        title,
        description,
        tags: tags ?? [],
        isPublic: isPublic ?? false,
      })
      .returning();

    return NextResponse.json(studySet, { status: 201 });
  } catch (error) {
    console.error("Failed to create study set:", error);
    return NextResponse.json(
      { error: "Failed to create study set" },
      { status: 500 }
    );
  }
}
