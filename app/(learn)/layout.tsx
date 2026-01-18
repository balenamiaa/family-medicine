import { ReactNode } from "react";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell, Header } from "@/components/layouts";
import { ModeSwitcher } from "@/components/ui";
import { getCurrentUserFromSessionToken, isAdmin } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { StudySetProvider } from "@/components/sets";
import { db, studySets, studyCards } from "@/db";
import { desc, eq, or, count } from "drizzle-orm";
import type { StudySetSummary } from "@/components/sets/StudySetProvider";

interface LearnLayoutProps {
  children: ReactNode;
}

const getAccessibleStudySets = unstable_cache(
  async (userId: string | null, isAdminUser: boolean) => {
    const whereConditions = isAdminUser
      ? undefined
      : userId
        ? or(
          eq(studySets.userId, userId),
          eq(studySets.type, "PUBLIC"),
          eq(studySets.type, "SYSTEM")
        )
        : or(
          eq(studySets.type, "PUBLIC"),
          eq(studySets.type, "SYSTEM")
        );

    const baseQuery = db
      .select({
        id: studySets.id,
        title: studySets.title,
        description: studySets.description,
        type: studySets.type,
        tags: studySets.tags,
        createdAt: studySets.createdAt,
        updatedAt: studySets.updatedAt,
        cardCount: count(studyCards.id),
      })
      .from(studySets)
      .leftJoin(studyCards, eq(studySets.id, studyCards.studySetId));

    const query = whereConditions ? baseQuery.where(whereConditions) : baseQuery;
    const results = await query
      .groupBy(
        studySets.id,
        studySets.title,
        studySets.description,
        studySets.type,
        studySets.tags,
        studySets.createdAt,
        studySets.updatedAt
      )
      .orderBy(desc(studySets.updatedAt));

    return results.map((set) => ({
      id: set.id,
      title: set.title,
      description: set.description,
      type: set.type,
      tags: set.tags ?? [],
      cardCount: Number(set.cardCount ?? 0),
      createdAt: set.createdAt.toISOString(),
      updatedAt: set.updatedAt.toISOString(),
    })) as StudySetSummary[];
  },
  ["learn-sets"],
  { revalidate: 30 }
);

export default async function LearnLayout({ children }: LearnLayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const user = await getCurrentUserFromSessionToken(token);

  if (!user) {
    redirect("/login");
  }

  const isAdminUser = isAdmin(user);
  const initialSets = await getAccessibleStudySets(user.id, isAdminUser);
  const fallbackSet = initialSets.find((set) => set.type === "SYSTEM") || initialSets[0] || null;

  return (
    <StudySetProvider
      initialSets={initialSets}
      initialActiveSetId={fallbackSet?.id ?? null}
    >
      <AppShell
        header={
          <Header
            centerContent={<ModeSwitcher />}
            showCategoryNav={true}
          />
        }
      >
        {children}
      </AppShell>
    </StudySetProvider>
  );
}
