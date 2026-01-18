import { NextRequest, NextResponse } from "next/server";
import { db, users, studySets } from "@/db";
import { eq, count, desc } from "drizzle-orm";
import { getCurrentUser, isAdmin } from "@/lib/auth";

// GET /api/users - Get current user or list all users (admin)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    const includeSetCount = searchParams.get("include")?.includes("setCount");

    const currentUser = await getCurrentUser(request);
    if (!isAdmin(currentUser)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    if (email) {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      if (includeSetCount) {
        const [userWithCounts] = await db
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
          .where(eq(users.id, user.id))
          .groupBy(users.id);

        return NextResponse.json({ users: userWithCounts ? [userWithCounts] : [] });
      }

      return NextResponse.json({ users: [user] });
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
    const currentUser = await getCurrentUser(request);
    if (!isAdmin(currentUser)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
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
