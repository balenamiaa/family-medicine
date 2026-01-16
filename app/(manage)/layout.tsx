"use client";

import { ReactNode } from "react";
import { AppShell, Header, ManageSidebar } from "@/components/layouts";

interface ManageLayoutProps {
  children: ReactNode;
}

export default function ManageLayout({ children }: ManageLayoutProps) {
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
