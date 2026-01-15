import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

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

    // Get progress records, optionally filtered by due date
    const progressRecords = await prisma.cardProgress.findMany({
      where: {
        userId,
        ...(dueOnly && { nextReviewDate: { lte: now } }),
        card: studySetId ? { studySetId } : undefined,
      },
      include: {
        card: {
          select: {
            id: true,
            cardType: true,
            content: true,
            difficulty: true,
            studySetId: true,
          },
        },
      },
      orderBy: [
        { nextReviewDate: "asc" },
      ],
      take: limit,
    });

    // Get stats
    const stats = await prisma.cardProgress.groupBy({
      by: ["userId"],
      where: { userId },
      _count: { _all: true },
      _avg: { easeFactor: true },
    });

    const dueCount = await prisma.cardProgress.count({
      where: {
        userId,
        nextReviewDate: { lte: now },
        card: studySetId ? { studySetId } : undefined,
      },
    });

    return NextResponse.json({
      progress: progressRecords,
      stats: {
        totalCards: stats[0]?._count._all ?? 0,
        avgEaseFactor: stats[0]?._avg.easeFactor ?? 2.5,
        dueNow: dueCount,
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

    // Get existing progress or create new
    const existing = await prisma.cardProgress.findUnique({
      where: { userId_cardId: { userId, cardId } },
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

    // Update progress
    const progress = await prisma.cardProgress.upsert({
      where: { userId_cardId: { userId, cardId } },
      update: {
        easeFactor,
        intervalDays,
        repetitions,
        nextReviewDate,
        lastReviewedAt: now,
        totalReviews: { increment: 1 },
        correctReviews: correct ? { increment: 1 } : undefined,
        avgResponseTime: responseTimeMs
          ? existing?.avgResponseTime
            ? existing.avgResponseTime * 0.7 + responseTimeMs * 0.3
            : responseTimeMs
          : undefined,
      },
      create: {
        userId,
        cardId,
        easeFactor,
        intervalDays,
        repetitions,
        nextReviewDate,
        lastReviewedAt: now,
        totalReviews: 1,
        correctReviews: correct ? 1 : 0,
        avgResponseTime: responseTimeMs ?? undefined,
      },
    });

    // Record in history
    await prisma.reviewHistory.create({
      data: {
        userId,
        cardId,
        quality,
        correct,
        responseTimeMs,
      },
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
