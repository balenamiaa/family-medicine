import { NextRequest, NextResponse } from "next/server";
import { db, users, loginTokens } from "@/db";
import { and, eq, gt } from "drizzle-orm";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";
import { isAdminEmail, isEmailAllowed } from "@/lib/auth";
import { createHash } from "crypto";

interface VerifyPayload {
  email?: string;
  code?: string;
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyPayload;
    const rawEmail = body.email?.trim().toLowerCase();
    const rawCode = body.code?.trim();
    const rawName = body.name?.trim();

    if (!rawEmail || !rawEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!rawCode || rawCode.length < 4) {
      return NextResponse.json(
        { error: "A valid login code is required." },
        { status: 400 }
      );
    }

    if (!isEmailAllowed(rawEmail)) {
      return NextResponse.json(
        { error: "This email is not allowed to sign in." },
        { status: 403 }
      );
    }

    const codeHash = createHash("sha256").update(rawCode).digest("hex");
    const token = await db.query.loginTokens.findFirst({
      where: and(
        eq(loginTokens.email, rawEmail),
        eq(loginTokens.tokenHash, codeHash),
        gt(loginTokens.expiresAt, new Date())
      ),
    });

    if (!token) {
      return NextResponse.json(
        { error: "Invalid or expired code. Please try again." },
        { status: 400 }
      );
    }

    await db.delete(loginTokens).where(eq(loginTokens.email, rawEmail));

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
      const hasName = Boolean(user.name && user.name.trim().length > 0);
      if (rawName && !hasName) updates.name = rawName;
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

    const sessionToken = createSessionToken({ userId: user.id, email: user.email });
    const response = NextResponse.json({ user });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Failed to verify login code:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes('relation "login_tokens" does not exist')) {
      return NextResponse.json(
        { error: "Database schema is missing. Run `npm run db:push` to create tables." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
