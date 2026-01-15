import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/study-sets - List all study sets
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    const studySets = await prisma.studySet.findMany({
      where: userId ? { userId } : undefined,
      include: {
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(studySets);
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

    const studySet = await prisma.studySet.create({
      data: {
        userId,
        title,
        description,
        tags: tags ?? [],
        isPublic: isPublic ?? false,
      },
    });

    return NextResponse.json(studySet, { status: 201 });
  } catch (error) {
    console.error("Failed to create study set:", error);
    return NextResponse.json(
      { error: "Failed to create study set" },
      { status: 500 }
    );
  }
}
