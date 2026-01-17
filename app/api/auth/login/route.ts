import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";
import { isAdminEmail } from "@/lib/auth";

interface LoginPayload {
  email?: string;
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginPayload;
    const rawEmail = body.email?.trim().toLowerCase();
    const rawName = body.name?.trim();

    if (!rawEmail || !rawEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const shouldBeAdmin = isAdminEmail(rawEmail);

    let user = await db.query.users.findFirst({
      where: eq(users.email, rawEmail),
    });

    if (!user) {
      const [created] = await db
        .insert(users)
        .values({
          email: rawEmail,
          name: rawName || rawEmail.split("@")[0],
          role: shouldBeAdmin ? "ADMIN" : "USER",
        })
        .returning();
      user = created;
    } else {
      const updates: Partial<typeof users.$inferInsert> = {};
      if (rawName && rawName !== user.name) updates.name = rawName;
      if (shouldBeAdmin && user.role !== "ADMIN") updates.role = "ADMIN";

      if (Object.keys(updates).length > 0) {
        const [updated] = await db
          .update(users)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(users.id, user.id))
          .returning();
        user = updated;
      }
    }

    const token = createSessionToken({ userId: user.id, email: user.email });
    const response = NextResponse.json({ user });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Failed to log in:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes('relation "users" does not exist')) {
      return NextResponse.json(
        { error: "Database schema is missing. Run `npm run db:push` to create tables." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
