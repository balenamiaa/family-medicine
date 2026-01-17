import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell, Header, ManageSidebar } from "@/components/layouts";
import { getCurrentUserFromSessionToken } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session";

interface ManageLayoutProps {
  children: ReactNode;
}

export default async function ManageLayout({ children }: ManageLayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const user = await getCurrentUserFromSessionToken(token);

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell
      header={
        <Header
          showCategoryNav={true}
        />
      }
      sidebar={<ManageSidebar />}
      sidebarPosition="left"
    >
      {children}
    </AppShell>
  );
}
