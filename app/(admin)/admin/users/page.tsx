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
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length === 0) return;
    setSelectedUserIds((prev) => {
      const allowed = new Set(users.map((user) => user.id));
      const next = new Set(Array.from(prev).filter((id) => allowed.has(id)));
      return next;
    });
  }, [users]);

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

  const handleNameChange = async (userId: string, nextName: string | null) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update name");
      }

      const updated = await response.json().catch(() => null);
      setUsers(users.map((user) =>
        user.id === userId
          ? { ...user, name: updated?.name ?? nextName }
          : user
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update name");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesRole = filter === "ALL" || user.role === filter;
    const matchesSearch = search === "" ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const selectedUsers = users.filter((user) => selectedUserIds.has(user.id));
  const selectedCount = selectedUsers.length;

  const handleToggleSelect = (userId: string) => {
    setEmailError(null);
    setEmailSuccess(null);
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = (checked: boolean, userIds: string[]) => {
    setEmailError(null);
    setEmailSuccess(null);
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      userIds.forEach((id) => {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return next;
    });
  };

  const handleSendEmail = async () => {
    if (isSendingEmail) return;
    setEmailError(null);
    setEmailSuccess(null);

    const subject = emailSubject.trim();
    const message = emailMessage.trim();
    const userIds = Array.from(selectedUserIds);

    if (!subject || !message) {
      setEmailError("Subject and message are required.");
      return;
    }

    if (userIds.length === 0) {
      setEmailError("Select at least one recipient.");
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds, subject, message }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setEmailSuccess(`Sent to ${data.sent ?? userIds.length} recipients.`);
      setEmailMessage("");
      setSelectedUserIds(new Set());
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

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

      {/* Email Composer */}
      <div className="card p-6 mb-6 relative overflow-hidden">
        <div className="absolute -top-16 right-0 w-48 h-48 rounded-full bg-[var(--bg-accent)]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-64 h-64 rounded-full bg-[var(--success-bg)]/30 blur-3xl pointer-events-none" />
        <div className="relative space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Email Users
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Send updates directly to selected users.
              </p>
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              Selected: <span className="font-semibold text-[var(--text-primary)]">{selectedCount}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedCount === 0 ? (
              <span className="text-xs text-[var(--text-muted)]">
                No recipients selected yet.
              </span>
            ) : (
              <>
                {selectedUsers.slice(0, 3).map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs text-[var(--text-secondary)]"
                  >
                    {(user.name || user.email).slice(0, 16)}
                  </span>
                ))}
                {selectedCount > 3 && (
                  <span className="text-xs text-[var(--text-muted)]">
                    +{selectedCount - 3} more
                  </span>
                )}
              </>
            )}
          </div>

          <div className="grid gap-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Subject
              <input
                type="text"
                value={emailSubject}
                onChange={(event) => {
                  setEmailSubject(event.target.value);
                  setEmailError(null);
                  setEmailSuccess(null);
                }}
                placeholder="Upcoming study plan update"
                className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)]"
              />
            </label>

            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Message
              <textarea
                value={emailMessage}
                onChange={(event) => {
                  setEmailMessage(event.target.value);
                  setEmailError(null);
                  setEmailSuccess(null);
                }}
                placeholder="Share what's new, encourage progress, or give next steps."
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)]"
              />
            </label>
          </div>

          {emailError && (
            <div className="rounded-xl border border-[var(--error-border)] bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error-text)]">
              {emailError}
            </div>
          )}

          {emailSuccess && (
            <div className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] px-4 py-3 text-sm text-[var(--success-text)]">
              {emailSuccess}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[var(--text-muted)]">
                Use the table checkboxes to choose recipients.
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedUserIds(new Set());
                  setEmailError(null);
                  setEmailSuccess(null);
                }}
                disabled={selectedUserIds.size === 0}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium border border-[var(--border-subtle)]",
                  "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
                  "hover:bg-[var(--bg-card-hover)]",
                  selectedUserIds.size === 0 && "opacity-60 cursor-not-allowed"
                )}
              >
                Clear selection
              </button>
            </div>
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSendingEmail || selectedUserIds.size === 0 || !emailSubject.trim() || !emailMessage.trim()}
              aria-busy={isSendingEmail}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold",
                "bg-[var(--bg-accent)] text-[var(--text-inverse)] transition-all",
                "hover:opacity-90 active:scale-[0.98]",
                (isSendingEmail || selectedUserIds.size === 0 || !emailSubject.trim() || !emailMessage.trim())
                  && "opacity-60 cursor-not-allowed"
              )}
            >
              {isSendingEmail && (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              Send email
            </button>
          </div>
        </div>
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
        <UserTable
          users={filteredUsers}
          onRoleChange={handleRoleChange}
          onNameChange={handleNameChange}
          selectedIds={selectedUserIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
        />
      </div>

      {/* Count */}
      <p className="text-sm text-[var(--text-muted)] mt-4">
        Showing {filteredUsers.length} of {users.length} users
      </p>
    </div>
  );
}
