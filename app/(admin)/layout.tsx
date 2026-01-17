import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell, Header, AdminSidebar } from "@/components/layouts";
import { getCurrentUserFromSessionToken, isAdmin } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const user = await getCurrentUserFromSessionToken(token);

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin(user)) {
    redirect("/");
  }

  return (
    <AppShell
      header={<Header showCategoryNav={false} />}
      sidebar={<AdminSidebar />}
      sidebarPosition="left"
    >
      {children}
    </AppShell>
  );
}
