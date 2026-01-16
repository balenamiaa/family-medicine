"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  setCount?: number;
}

interface UserTableProps {
  users: User[];
  onRoleChange?: (userId: string, newRole: "ADMIN" | "USER") => Promise<void>;
}

export function UserTable({ users, onRoleChange }: UserTableProps) {
  const [isChanging, setIsChanging] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "USER") => {
    if (!onRoleChange) return;
    setIsChanging(userId);
    try {
      await onRoleChange(userId, newRole);
    } finally {
      setIsChanging(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-muted)]">
              User
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-muted)]">
              Role
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-muted)]">
              Sets
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-muted)]">
              Joined
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-muted)]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {(user.name?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {user.name || "Unnamed"}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium",
                    user.role === "ADMIN"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {user.role}
                </span>
              </td>
              <td className="py-4 px-4 text-[var(--text-secondary)]">
                {user.setCount ?? "—"}
              </td>
              <td className="py-4 px-4 text-sm text-[var(--text-muted)]">
                {formatDate(user.createdAt)}
              </td>
              <td className="py-4 px-4 text-right">
                {onRoleChange && (
                  <div className="relative inline-block">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as "ADMIN" | "USER")
                      }
                      disabled={isChanging === user.id}
                      className={cn(
                        "appearance-none bg-[var(--bg-secondary)] border border-[var(--border-subtle)]",
                        "rounded-lg px-3 py-1.5 pr-8 text-sm text-[var(--text-primary)]",
                        "focus:outline-none focus:border-[var(--border-accent)]",
                        "transition-all cursor-pointer",
                        isChanging === user.id && "opacity-50 cursor-wait"
                      )}
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <svg
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          No users found
        </div>
      )}
    </div>
  );
}
