"use client";

import { ReactNode } from "react";
import { AppShell, Header } from "@/components/layouts";
import { ModeSwitcher } from "@/components/ui";

interface LearnLayoutProps {
  children: ReactNode;
}

export default function LearnLayout({ children }: LearnLayoutProps) {
  return (
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
  );
}
