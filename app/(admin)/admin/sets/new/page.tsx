"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StudySetForm } from "@/components/sets";

export default function AdminNewStudySetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    type: "SYSTEM" | "PUBLIC" | "PRIVATE";
    tags: string[];
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/study-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create study set");
      }

      const result = await response.json();
      router.push(`/sets/${result.id}`);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const handleCancel = () => {
    router.push("/admin/sets");
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto w-full">
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/admin/sets" className="hover:text-[var(--text-primary)] transition-colors">
          System Sets
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[var(--text-primary)]">Create New</span>
      </nav>

      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
          Create System Study Set
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Publish an official set for all users.
        </p>
      </div>

      <div className="card p-6">
        <StudySetForm
          initialData={{ type: "SYSTEM" }}
          allowedTypes={["SYSTEM", "PUBLIC"]}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Create System Set"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
