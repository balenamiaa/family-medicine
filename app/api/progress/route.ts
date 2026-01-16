import { NextRequest, NextResponse } from "next/server";
import { db, cardProgress, reviewHistory, studyCards } from "@/db";
import { eq, and, lte, count, avg } from "drizzle-orm";

// GET /api/progress - Get cards due for review
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const studySetId = searchParams.get("studySetId");
    const dueOnly = searchParams.get("dueOnly") === "true";
    const limit = parseInt(searchParams.get("limit") ?? "50");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Build conditions
    const conditions = [eq(cardProgress.userId, userId)];
    if (dueOnly) {
      conditions.push(lte(cardProgress.nextReviewDate, now));
    }

    // Get progress records with cards
    const progressRecords = await db.query.cardProgress.findMany({
      where: and(...conditions),
      with: {
        card: {
          columns: {
            id: true,
            cardType: true,
            content: true,
            difficulty: true,
            studySetId: true,
          },
        },
      },
      orderBy: (cp, { asc }) => [asc(cp.nextReviewDate)],
      limit,
    });

    // Filter by studySetId if provided (after join)
    const filteredProgress = studySetId
      ? progressRecords.filter((p) => p.card?.studySetId === studySetId)
      : progressRecords;

    // Get stats
    const [statsResult] = await db
      .select({
        totalCards: count(),
        avgEaseFactor: avg(cardProgress.easeFactor),
      })
      .from(cardProgress)
      .where(eq(cardProgress.userId, userId));

    // Get due count
    const dueConditions = [
      eq(cardProgress.userId, userId),
      lte(cardProgress.nextReviewDate, now),
    ];

    const [dueResult] = await db
      .select({ count: count() })
      .from(cardProgress)
      .where(and(...dueConditions));

    return NextResponse.json({
      progress: filteredProgress,
      stats: {
        totalCards: statsResult?.totalCards ?? 0,
        avgEaseFactor: statsResult?.avgEaseFactor ?? 2.5,
        dueNow: dueResult?.count ?? 0,
      },
    });
  } catch (error) {
    console.error("Failed to fetch progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

// POST /api/progress - Record a review answer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, cardId, quality, correct, responseTimeMs } = body;

    if (!userId || !cardId || quality === undefined || correct === undefined) {
      return NextResponse.json(
        { error: "userId, cardId, quality, and correct are required" },
        { status: 400 }
      );
    }

    // Get existing progress
    const existing = await db.query.cardProgress.findFirst({
      where: and(
        eq(cardProgress.userId, userId),
        eq(cardProgress.cardId, cardId)
      ),
    });

    // Calculate new SM-2 values
    const now = new Date();
    let easeFactor = existing?.easeFactor ?? 2.5;
    let intervalDays = existing?.intervalDays ?? 0;
    let repetitions = existing?.repetitions ?? 0;

    if (quality < 3) {
      // Incorrect - reset
      repetitions = 0;
      intervalDays = 1;
    } else {
      // Correct
      if (repetitions === 0) {
        intervalDays = 1;
      } else if (repetitions === 1) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }
      repetitions += 1;
    }

    // Update ease factor (minimum 1.3)
    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    const nextReviewDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    // Calculate new avg response time
    const newAvgResponseTime = responseTimeMs
      ? existing?.avgResponseTime
        ? existing.avgResponseTime * 0.7 + responseTimeMs * 0.3
        : responseTimeMs
      : existing?.avgResponseTime;

    let progress;

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(cardProgress)
        .set({
          easeFactor,
          intervalDays,
          repetitions,
          nextReviewDate,
          lastReviewedAt: now,
          totalReviews: (existing.totalReviews ?? 0) + 1,
          correctReviews: correct
            ? (existing.correctReviews ?? 0) + 1
            : existing.correctReviews,
          avgResponseTime: newAvgResponseTime,
        })
        .where(eq(cardProgress.id, existing.id))
        .returning();
      progress = updated;
    } else {
      // Create new
      const [created] = await db
        .insert(cardProgress)
        .values({
          userId,
          cardId,
          easeFactor,
          intervalDays,
          repetitions,
          nextReviewDate,
          lastReviewedAt: now,
          totalReviews: 1,
          correctReviews: correct ? 1 : 0,
          avgResponseTime: responseTimeMs,
        })
        .returning();
      progress = created;
    }

    // Record in history
    await db.insert(reviewHistory).values({
      userId,
      cardId,
      quality,
      correct,
      responseTimeMs,
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Failed to record progress:", error);
    return NextResponse.json(
      { error: "Failed to record progress" },
      { status: 500 }
    );
  }
}
