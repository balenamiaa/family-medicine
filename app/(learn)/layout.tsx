import { ReactNode } from "react";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell, Header } from "@/components/layouts";
import { ModeSwitcher } from "@/components/ui";
import { getCurrentUserFromSessionToken, isAdmin } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { StudySetProvider } from "@/components/sets";
import { db, studySets } from "@/db";
import { desc, eq, or } from "drizzle-orm";
import { toFrontendCard } from "@/lib/card-utils";
import type { StudySetDetail, StudySetSummary } from "@/components/sets/StudySetProvider";

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

    const results = await db.query.studySets.findMany({
      where: whereConditions,
      with: {
        cards: {
          columns: { id: true },
        },
      },
      orderBy: [desc(studySets.updatedAt)],
    });

    return results.map((set) => ({
      id: set.id,
      title: set.title,
      description: set.description,
      type: set.type,
      tags: set.tags ?? [],
      cardCount: set.cards.length,
      createdAt: set.createdAt.toISOString(),
      updatedAt: set.updatedAt.toISOString(),
    })) as StudySetSummary[];
  },
  ["learn-sets"],
  { revalidate: 30 }
);

const getStudySetDetail = unstable_cache(
  async (setId: string, userId: string | null, isAdminUser: boolean) => {
    const studySet = await db.query.studySets.findFirst({
      where: eq(studySets.id, setId),
      with: {
        cards: {
          orderBy: (cards, { asc }) => [asc(cards.orderIndex)],
        },
      },
    });

    if (!studySet) return null;
    if (!isAdminUser && studySet.type === "PRIVATE" && studySet.userId !== userId) {
      return null;
    }

    const cards = studySet.cards.map(toFrontendCard);
    return {
      id: studySet.id,
      title: studySet.title,
      description: studySet.description,
      type: studySet.type,
      tags: studySet.tags ?? [],
      cardCount: cards.length,
      createdAt: studySet.createdAt.toISOString(),
      updatedAt: studySet.updatedAt.toISOString(),
      cards,
    } as StudySetDetail;
  },
  ["learn-active-set"],
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
  const initialActiveSet = fallbackSet
    ? await getStudySetDetail(fallbackSet.id, user.id, isAdminUser)
    : null;

  return (
    <StudySetProvider
      initialSets={initialSets}
      initialActiveSet={initialActiveSet}
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
