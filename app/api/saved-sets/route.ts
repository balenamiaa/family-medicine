import { NextRequest, NextResponse } from "next/server";
import { db, savedSets, studyCards, studySets, users } from "@/db";
import { and, count, desc, eq, gte, lte, or } from "drizzle-orm";
import { getCurrentUser, canViewSet, isAdmin } from "@/lib/auth";
import {
  buildStudySetSearchConditions,
  parseStudySetSearchParams,
} from "@/lib/study-set-search";

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const filters = parseStudySetSearchParams(request.nextUrl.searchParams);
    const {
      searchCondition,
      typeCondition,
      tagsCondition,
      authorCondition,
      rank,
    } = buildStudySetSearchConditions(filters);

    const viewCondition = isAdmin(user)
      ? undefined
      : or(
        eq(studySets.type, "PUBLIC"),
        eq(studySets.type, "SYSTEM"),
        eq(studySets.userId, user.id)
      );

    const whereClause = and(
      eq(savedSets.userId, user.id),
      viewCondition,
      searchCondition,
      typeCondition,
      tagsCondition,
      authorCondition
    );

    const cardCountExpr = count(studyCards.id);
    const havingConditions = [
      filters.minCards !== null ? gte(cardCountExpr, filters.minCards) : undefined,
      filters.maxCards !== null ? lte(cardCountExpr, filters.maxCards) : undefined,
    ].filter(Boolean);

    const baseQuery = db
      .select({
        id: studySets.id,
        title: studySets.title,
        description: studySets.description,
        type: studySets.type,
        tags: studySets.tags,
        createdAt: studySets.createdAt,
        updatedAt: studySets.updatedAt,
        cardCount: cardCountExpr,
        savedAt: savedSets.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(savedSets)
      .innerJoin(studySets, eq(savedSets.studySetId, studySets.id))
      .leftJoin(users, eq(studySets.userId, users.id))
      .leftJoin(studyCards, eq(studySets.id, studyCards.studySetId))
      .where(whereClause)
      .groupBy(studySets.id, users.id, savedSets.id);

    const filteredQuery = havingConditions.length > 0
      ? baseQuery.having(and(...havingConditions))
      : baseQuery;

    const orderBy = (() => {
      switch (filters.sort) {
        case "newest":
          return desc(studySets.createdAt);
        case "cards":
          return desc(cardCountExpr);
        case "relevance":
          return rank ? desc(rank) : desc(studySets.updatedAt);
        case "updated":
        default:
          return desc(studySets.updatedAt);
      }
    })();

    const results = await filteredQuery
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(filters.offset);

    const countBase = db
      .select({ id: studySets.id })
      .from(savedSets)
      .innerJoin(studySets, eq(savedSets.studySetId, studySets.id))
      .leftJoin(users, eq(studySets.userId, users.id))
      .leftJoin(studyCards, eq(studySets.id, studyCards.studySetId))
      .where(whereClause)
      .groupBy(studySets.id, users.id, savedSets.id);

    const countQuery = havingConditions.length > 0
      ? countBase.having(and(...havingConditions))
      : countBase;

    const [{ total }] = await db
      .select({ total: count() })
      .from(countQuery.as("filtered_saved_sets"));

    return NextResponse.json({
      studySets: results.map((set) => ({
        id: set.id,
        title: set.title,
        description: set.description,
        type: set.type,
        tags: set.tags ?? [],
        cardCount: Number(set.cardCount ?? 0),
        createdAt: set.createdAt?.toISOString?.() ?? set.createdAt,
        updatedAt: set.updatedAt?.toISOString?.() ?? set.updatedAt,
        savedAt: set.savedAt?.toISOString?.() ?? set.savedAt,
        user: set.user,
        isSaved: true,
      })),
      total,
      limit: filters.limit,
      offset: filters.offset,
    });
  } catch (error) {
    console.error("Failed to fetch saved sets:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved sets" },
      { status: 500 }
    );
  } finally {
    console.info(`[api] GET /api/saved-sets ${Date.now() - startedAt}ms`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const studySetId = body.studySetId as string | undefined;

    if (!studySetId) {
      return NextResponse.json(
        { error: "studySetId is required" },
        { status: 400 }
      );
    }

    const set = await db.query.studySets.findFirst({
      where: eq(studySets.id, studySetId),
    });

    if (!set) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    if (!canViewSet(user, set)) {
      return NextResponse.json(
        { error: "You don't have permission to save this set" },
        { status: 403 }
      );
    }

    await db
      .insert(savedSets)
      .values({ userId: user.id, studySetId })
      .onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save study set:", error);
    return NextResponse.json(
      { error: "Failed to save study set" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const studySetId = request.nextUrl.searchParams.get("studySetId");
    if (!studySetId) {
      return NextResponse.json(
        { error: "studySetId is required" },
        { status: 400 }
      );
    }

    await db
      .delete(savedSets)
      .where(and(eq(savedSets.userId, user.id), eq(savedSets.studySetId, studySetId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove saved set:", error);
    return NextResponse.json(
      { error: "Failed to remove saved set" },
      { status: 500 }
    );
  }
}
