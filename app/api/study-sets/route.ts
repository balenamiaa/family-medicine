import { NextRequest, NextResponse } from "next/server";
import { db, studySets, StudySetType } from "@/db";
import { eq, desc, or, and } from "drizzle-orm";
import { getCurrentUser, canViewSet, canCreateSetOfType, isAdmin } from "@/lib/auth";

// GET /api/study-sets - List study sets
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") as StudySetType | null;
    const owned = searchParams.get("owned") === "true";

    // Build query conditions based on user permissions
    let whereConditions;

    if (owned && user) {
      // Only show sets owned by the current user
      whereConditions = eq(studySets.userId, user.id);
    } else if (userId) {
      // Filter by specific user
      if (userId !== user?.id && !isAdmin(user)) {
        // Non-admin can only see public sets from other users
        whereConditions = and(
          eq(studySets.userId, userId),
          eq(studySets.type, "PUBLIC")
        );
      } else {
        whereConditions = eq(studySets.userId, userId);
      }
    } else if (type) {
      // Filter by type
      whereConditions = eq(studySets.type, type);
    } else {
      // Default: show accessible sets
      if (user && isAdmin(user)) {
        // Admins see everything
        whereConditions = undefined;
      } else if (user) {
        // Users see: their own sets + public + system
        whereConditions = or(
          eq(studySets.userId, user.id),
          eq(studySets.type, "PUBLIC"),
          eq(studySets.type, "SYSTEM")
        );
      } else {
        // Anonymous: only public and system
        whereConditions = or(
          eq(studySets.type, "PUBLIC"),
          eq(studySets.type, "SYSTEM")
        );
      }
    }

    const results = await db.query.studySets.findMany({
      where: whereConditions,
      with: {
        cards: true,
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
      orderBy: [desc(studySets.updatedAt)],
    });

    // Filter results based on view permissions and add card count
    const studySetsList = results
      .filter((set) => canViewSet(user, set))
      .map((set) => ({
        id: set.id,
        title: set.title,
        description: set.description,
        type: set.type,
        tags: set.tags,
        cardCount: set.cards.length,
        createdAt: set.createdAt,
        updatedAt: set.updatedAt,
        userId: set.userId,
        user: set.user,
      }));

    return NextResponse.json({ studySets: studySetsList });
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
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, tags, type } = body;

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    // Default to PRIVATE if no type specified
    const setType: StudySetType = type || "PRIVATE";

    // Check if user can create this type of set
    if (!canCreateSetOfType(user, setType)) {
      return NextResponse.json(
        { error: `You cannot create ${setType} study sets` },
        { status: 403 }
      );
    }

    const [studySet] = await db
      .insert(studySets)
      .values({
        userId: user.id,
        title,
        description,
        tags: tags ?? [],
        type: setType,
      })
      .returning();

    return NextResponse.json(studySet, { status: 201 });
  } catch (error) {
    console.error("Failed to create study set:", error);
    return NextResponse.json(
      { error: "Failed to create study set" },
      { status: 500 }
    );
  }
}
