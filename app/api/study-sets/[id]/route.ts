import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/study-sets/[id] - Get a specific study set with cards
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const studySet = await prisma.studySet.findUnique({
      where: { id },
      include: {
        cards: {
          orderBy: { orderIndex: "asc" },
        },
        _count: {
          select: { cards: true },
        },
      },
    });

    if (!studySet) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(studySet);
  } catch (error) {
    console.error("Failed to fetch study set:", error);
    return NextResponse.json(
      { error: "Failed to fetch study set" },
      { status: 500 }
    );
  }
}

// PUT /api/study-sets/[id] - Update a study set
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, tags, isPublic } = body;

    const studySet = await prisma.studySet.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json(studySet);
  } catch (error) {
    console.error("Failed to update study set:", error);
    return NextResponse.json(
      { error: "Failed to update study set" },
      { status: 500 }
    );
  }
}

// DELETE /api/study-sets/[id] - Delete a study set
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.studySet.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete study set:", error);
    return NextResponse.json(
      { error: "Failed to delete study set" },
      { status: 500 }
    );
  }
}
