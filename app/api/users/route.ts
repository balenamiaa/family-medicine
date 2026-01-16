import { NextRequest, NextResponse } from "next/server";
import { db, users, studySets, cardProgress, reviewHistory } from "@/db";
import { eq, count, desc, sql } from "drizzle-orm";
import { getCurrentUser, isAdmin } from "@/lib/auth";

// GET /api/users - Get current user or list all users (admin)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    const includeSetCount = searchParams.get("include")?.includes("setCount");
    const listAll = searchParams.get("list") === "all" || !email;

    const currentUser = await getCurrentUser(request);

    // If listing all users, require admin
    if (listAll && !email) {
      if (!isAdmin(currentUser)) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }

      // Get all users with optional set count
      if (includeSetCount) {
        const allUsers = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
            setCount: count(studySets.id),
          })
          .from(users)
          .leftJoin(studySets, eq(users.id, studySets.userId))
          .groupBy(users.id)
          .orderBy(desc(users.createdAt));

        return NextResponse.json({ users: allUsers });
      }

      const allUsers = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt));

      return NextResponse.json({ users: allUsers });
    }

    // Get or create a specific user by email
    const targetEmail = email ?? "local@medcram.app";

    let user = await db.query.users.findFirst({
      where: eq(users.email, targetEmail),
    });

    // Create if not exists
    if (!user) {
      const [created] = await db
        .insert(users)
        .values({
          email: targetEmail,
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
