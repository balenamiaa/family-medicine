import { NextRequest, NextResponse } from "next/server";
import { db, users, UserRole } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentUser, isAdmin } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get a specific user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser(request);
    const { id } = await params;

    // Only admins can view other users
    if (!isAdmin(currentUser) && currentUser?.id !== id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user (admin only for role changes)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser(request);
    const { id } = await params;
    const body = await request.json();

    // Check if target user exists
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const isSelf = currentUser?.id === id;
    const isAdminUser = isAdmin(currentUser);

    // Role changes require admin
    if ("role" in body && !isAdminUser) {
      return NextResponse.json(
        { error: "Only admins can change user roles" },
        { status: 403 }
      );
    }

    // Non-admins can only update themselves and only name
    if (!isAdminUser && !isSelf) {
      return NextResponse.json(
        { error: "You can only update your own profile" },
        { status: 403 }
      );
    }

    // Build update object
    const updates: Partial<typeof targetUser> = {};

    if ("name" in body) {
      updates.name = body.name;
    }

    if ("role" in body && isAdminUser) {
      // Validate role
      if (!["ADMIN", "USER"].includes(body.role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be ADMIN or USER" },
          { status: 400 }
        );
      }
      updates.role = body.role as UserRole;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser(request);
    const { id } = await params;

    if (!isAdmin(currentUser)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (currentUser?.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
