"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserTable } from "@/components/admin";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  setCount?: number;
}

type FilterRole = "ALL" | "ADMIN" | "USER";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterRole>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/users?include=setCount");
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "USER") => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      // Update local state
      setUsers(users.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesRole = filter === "ALL" || user.role === filter;
    const matchesSearch = search === "" ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-[var(--bg-secondary)] rounded" />
          <div className="h-12 bg-[var(--bg-secondary)] rounded-xl" />
          <div className="h-96 bg-[var(--bg-secondary)] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="card p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-[var(--error-text)] mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{error}</h2>
          <Link href="/admin/dashboard" className="btn btn-primary mt-4">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
          User Management
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Manage users and their roles
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)]"
            />
          </div>

          {/* Role filter */}
          <div className="flex gap-2">
            {(["ALL", "ADMIN", "USER"] as FilterRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setFilter(role)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  filter === role
                    ? "bg-[var(--bg-accent)] text-[var(--text-inverse)]"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                )}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="card overflow-hidden">
        <UserTable users={filteredUsers} onRoleChange={handleRoleChange} />
      </div>

      {/* Count */}
      <p className="text-sm text-[var(--text-muted)] mt-4">
        Showing {filteredUsers.length} of {users.length} users
      </p>
    </div>
  );
}
