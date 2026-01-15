import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/users - Get or create a local user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email") ?? "local@medcram.app";

    // Get or create the local user
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: "Local User",
      },
      include: {
        _count: {
          select: {
            studySets: true,
            cardProgress: true,
            reviewHistory: true,
          },
        },
      },
    });

    return NextResponse.json(user);
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

    const user = await prisma.user.create({
      data: {
        email,
        name,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
