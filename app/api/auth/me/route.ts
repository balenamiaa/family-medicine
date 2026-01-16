import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// GET /api/auth/me - Get current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to get current user:", error);
    // Return null user instead of error to handle gracefully
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
