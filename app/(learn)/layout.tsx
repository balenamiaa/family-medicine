import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell, Header } from "@/components/layouts";
import { ModeSwitcher } from "@/components/ui";
import { getCurrentUserFromSessionToken } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { StudySetProvider } from "@/components/sets";

interface LearnLayoutProps {
  children: ReactNode;
}

export default async function LearnLayout({ children }: LearnLayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const user = await getCurrentUserFromSessionToken(token);

  if (!user) {
    redirect("/login");
  }

  return (
    <StudySetProvider>
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
