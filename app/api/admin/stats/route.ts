import { NextRequest, NextResponse } from "next/server";
import { db, users, studySets, studyCards, cardProgress } from "@/db";
import { count, eq, sql, desc, and, gte } from "drizzle-orm";
import { getCurrentUser, isAdmin } from "@/lib/auth";

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get total counts
    const [userCount] = await db.select({ count: count() }).from(users);
    const [setCount] = await db.select({ count: count() }).from(studySets);
    const [cardCount] = await db.select({ count: count() }).from(studyCards);
    const [progressCount] = await db.select({ count: count() }).from(cardProgress);

    // Get counts by type
    const setsByType = await db
      .select({
        type: studySets.type,
        count: count(),
      })
      .from(studySets)
      .groupBy(studySets.type);

    // Get counts by role
    const usersByRole = await db
      .select({
        role: users.role,
        count: count(),
      })
      .from(users)
      .groupBy(users.role);

    // Get recent activity (users created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo));

    const [recentSets] = await db
      .select({ count: count() })
      .from(studySets)
      .where(gte(studySets.createdAt, thirtyDaysAgo));

    // Get top 5 study sets by card count
    const topSets = await db
      .select({
        id: studySets.id,
        title: studySets.title,
        type: studySets.type,
        cardCount: count(studyCards.id),
      })
      .from(studySets)
      .leftJoin(studyCards, eq(studySets.id, studyCards.studySetId))
      .groupBy(studySets.id, studySets.title, studySets.type)
      .orderBy(desc(count(studyCards.id)))
      .limit(5);

    // Get recent users
    const recentUsersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    return NextResponse.json({
      totals: {
        users: userCount.count,
        studySets: setCount.count,
        cards: cardCount.count,
        progress: progressCount.count,
      },
      byType: {
        sets: setsByType.reduce((acc, { type, count }) => ({ ...acc, [type]: count }), {}),
        users: usersByRole.reduce((acc, { role, count }) => ({ ...acc, [role]: count }), {}),
      },
      recent: {
        usersLast30Days: recentUsers.count,
        setsLast30Days: recentSets.count,
      },
      topSets,
      recentUsers: recentUsersList,
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
