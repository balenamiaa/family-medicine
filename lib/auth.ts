import { NextRequest } from "next/server";
import { db, users, User, StudySet, UserRole, StudySetType } from "@/db";
import { eq } from "drizzle-orm";
import { getSessionPayload, SESSION_COOKIE_NAME } from "@/lib/session";

// Admin emails - can be configured via environment variable
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "admin@medcram.app")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

/**
 * Get the current user from the request
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
    return await getCurrentUserFromSessionToken(token);
  } catch (error) {
    if (error instanceof Error && error.message.includes("AUTH_SESSION_SECRET")) {
      throw error;
    }
    console.error("Failed to get current user:", error);
    return null;
  }
}

export async function getCurrentUserFromSessionToken(
  token?: string | null
): Promise<User | null> {
  const payload = getSessionPayload(token);
  if (!payload) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.userId),
  });
  return user ?? null;
}

/**
 * Check if a user has admin role
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || isAdminEmail(user.email);
}

/**
 * Check if a user can edit a study set
 * - Admins can edit any set
 * - Users can only edit their own PRIVATE or PUBLIC sets
 * - Nobody except admins can edit SYSTEM sets
 */
export function canEditSet(user: User | null, set: StudySet): boolean {
  if (!user) return false;

  // Admins can edit everything
  if (isAdmin(user)) return true;

  // SYSTEM sets are admin-only
  if (set.type === "SYSTEM") return false;

  // Users can only edit their own sets
  return set.userId === user.id;
}

/**
 * Check if a user can delete a study set
 * Same rules as editing
 */
export function canDeleteSet(user: User | null, set: StudySet): boolean {
  return canEditSet(user, set);
}

/**
 * Check if a user can view a study set
 * - SYSTEM and PUBLIC sets are visible to everyone
 * - PRIVATE sets are only visible to owner or admin
 */
export function canViewSet(user: User | null, set: StudySet): boolean {
  // System and public sets are always visible
  if (set.type === "SYSTEM" || set.type === "PUBLIC") return true;

  // Private sets require authentication
  if (!user) return false;

  // Owner or admin can view private sets
  return set.userId === user.id || isAdmin(user);
}

/**
 * Check what types of study sets a user can create
 * - Admins can create SYSTEM, PUBLIC, or PRIVATE
 * - Users can only create PUBLIC or PRIVATE
 */
export function getAllowedSetTypes(user: User | null): StudySetType[] {
  if (!user) return [];

  if (isAdmin(user)) {
    return ["SYSTEM", "PUBLIC", "PRIVATE"];
  }

  return ["PUBLIC", "PRIVATE"];
}

/**
 * Validate that a user can create a set of a given type
 */
export function canCreateSetOfType(user: User | null, type: StudySetType): boolean {
  return getAllowedSetTypes(user).includes(type);
}

/**
 * Check if user can manage other users (admin only)
 */
export function canManageUsers(user: User | null): boolean {
  return isAdmin(user);
}

/**
 * Check if user can access admin dashboard
 */
export function canAccessAdmin(user: User | null): boolean {
  return isAdmin(user);
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "USER":
      return "User";
    default:
      return role;
  }
}

/**
 * Get study set type display name
 */
export function getSetTypeDisplayName(type: StudySetType): string {
  switch (type) {
    case "SYSTEM":
      return "System";
    case "PUBLIC":
      return "Public";
    case "PRIVATE":
      return "Private";
    default:
      return type;
  }
}
