import { AppShell, Header, AdminSidebar } from "@/components/layouts";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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
