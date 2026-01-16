"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell, Header, AdminSidebar } from "@/components/layouts";

interface User {
  id: string;
  role: "ADMIN" | "USER";
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const user: User | null = data.user;
          if (user?.role === "ADMIN") {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            router.replace("/");
          }
        } else {
          setIsAuthorized(false);
          router.replace("/");
        }
      } catch {
        setIsAuthorized(false);
        router.replace("/");
      }
    }
    checkAuth();
  }, [router]);

  // Show loading state while checking auth
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--bg-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authorized (will redirect)
  if (!isAuthorized) {
    return null;
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
