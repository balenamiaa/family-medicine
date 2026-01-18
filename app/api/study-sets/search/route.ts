import { NextRequest, NextResponse } from "next/server";
import { db, savedSets, studyCards, studySets, users, StudySetType } from "@/db";
import { and, count, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import {
  buildStudySetSearchConditions,
  parseStudySetSearchParams,
} from "@/lib/study-set-search";

const DISCOVER_TYPES: StudySetType[] = ["SYSTEM", "PUBLIC"];

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const user = await getCurrentUser(request);
    const viewerId = user?.id ?? "";
    const rawFilters = parseStudySetSearchParams(request.nextUrl.searchParams);

    const allowedTypes = rawFilters.types
      ? rawFilters.types.filter((type) => DISCOVER_TYPES.includes(type))
      : [...DISCOVER_TYPES];

    const filters = {
      ...rawFilters,
      types: allowedTypes,
    };

    const {
      searchCondition,
      typeCondition,
      tagsCondition,
      authorCondition,
      rank,
    } = buildStudySetSearchConditions(filters);

    const baseCondition = inArray(studySets.type, DISCOVER_TYPES);
    const whereClause = and(
      baseCondition,
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
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        savedId: savedSets.id,
      })
      .from(studySets)
      .leftJoin(users, eq(studySets.userId, users.id))
      .leftJoin(studyCards, eq(studySets.id, studyCards.studySetId))
      .leftJoin(
        savedSets,
        and(eq(savedSets.studySetId, studySets.id), eq(savedSets.userId, viewerId))
      )
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
      .from(studySets)
      .leftJoin(users, eq(studySets.userId, users.id))
      .leftJoin(studyCards, eq(studySets.id, studyCards.studySetId))
      .where(whereClause)
      .groupBy(studySets.id, users.id);

    const countQuery = havingConditions.length > 0
      ? countBase.having(and(...havingConditions))
      : countBase;

    const [{ total }] = await db
      .select({ total: count() })
      .from(countQuery.as("filtered_discover_sets"));

    const response = NextResponse.json({
      studySets: results.map((set) => ({
        id: set.id,
        title: set.title,
        description: set.description,
        type: set.type,
        tags: set.tags ?? [],
        cardCount: Number(set.cardCount ?? 0),
        createdAt: set.createdAt?.toISOString?.() ?? set.createdAt,
        updatedAt: set.updatedAt?.toISOString?.() ?? set.updatedAt,
        user: set.user,
        isSaved: Boolean(set.savedId),
      })),
      total,
      limit: filters.limit,
      offset: filters.offset,
    });

    response.headers.set("Cache-Control", "private, max-age=0, s-maxage=10");
    return response;
  } catch (error) {
    console.error("Failed to search study sets:", error);
    return NextResponse.json(
      { error: "Failed to search study sets" },
      { status: 500 }
    );
  } finally {
    console.info(`[api] GET /api/study-sets/search ${Date.now() - startedAt}ms`);
  }
}
