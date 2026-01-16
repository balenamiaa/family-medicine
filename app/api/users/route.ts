import { NextRequest, NextResponse } from "next/server";
import { db, users, studySets, cardProgress, reviewHistory } from "@/db";
import { eq, count } from "drizzle-orm";

// GET /api/users - Get or create a local user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email") ?? "local@medcram.app";

    // Try to find existing user
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Create if not exists
    if (!user) {
      const [created] = await db
        .insert(users)
        .values({
          email,
          name: "Local User",
        })
        .returning();
      user = created;
    }

    // Get counts
    const [studySetCount] = await db
      .select({ count: count() })
      .from(studySets)
      .where(eq(studySets.userId, user.id));

    const [progressCount] = await db
      .select({ count: count() })
      .from(cardProgress)
      .where(eq(cardProgress.userId, user.id));

    const [historyCount] = await db
      .select({ count: count() })
      .from(reviewHistory)
      .where(eq(reviewHistory.userId, user.id));

    return NextResponse.json({
      ...user,
      _count: {
        studySets: studySetCount?.count ?? 0,
        cardProgress: progressCount?.count ?? 0,
        reviewHistory: historyCount?.count ?? 0,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    const [user] = await db
      .insert(users)
      .values({
        email,
        name,
      })
      .returning();

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
