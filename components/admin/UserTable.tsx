"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
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
  onNameChange?: (userId: string, nextName: string | null) => Promise<void>;
  selectedIds?: Set<string>;
  onToggleSelect?: (userId: string) => void;
  onToggleSelectAll?: (checked: boolean, userIds: string[]) => void;
}

export function UserTable({
  users,
  onRoleChange,
  onNameChange,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: UserTableProps) {
  const [isChanging, setIsChanging] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const isSelectable = Boolean(selectedIds && onToggleSelect && onToggleSelectAll);
  const allSelected = isSelectable && users.length > 0 && users.every((user) => selectedIds?.has(user.id));
  const someSelected = isSelectable && users.some((user) => selectedIds?.has(user.id)) && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = Boolean(someSelected);
    }
  }, [someSelected]);

  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "USER") => {
    if (!onRoleChange) return;
    setIsChanging(userId);
    try {
      await onRoleChange(userId, newRole);
    } finally {
      setIsChanging(null);
    }
  };

  const startEditingName = (user: User) => {
    if (!onNameChange) return;
    setIsEditingName(user.id);
    setPendingName(user.name ?? "");
  };

  const cancelEditingName = () => {
    setIsEditingName(null);
    setPendingName("");
  };

  const submitNameChange = async () => {
    if (!onNameChange || !isEditingName) return;
    setIsSavingName(true);
    try {
      const trimmed = pendingName.trim();
      await onNameChange(isEditingName, trimmed.length > 0 ? trimmed : null);
      setIsEditingName(null);
      setPendingName("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update name");
    } finally {
      setIsSavingName(false);
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
            {isSelectable && (
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-muted)]">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={Boolean(allSelected)}
                  onChange={(event) =>
                    onToggleSelectAll?.(event.target.checked, users.map((user) => user.id))
                  }
                  aria-label="Select all users"
                  className="h-4 w-4 rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--bg-accent)]"
                />
              </th>
            )}
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
              {isSelectable && (
                <td className="py-4 px-4">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedIds?.has(user.id))}
                    onChange={() => onToggleSelect?.(user.id)}
                    aria-label={`Select ${user.name || user.email}`}
                    className="h-4 w-4 rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--bg-accent)]"
                  />
                </td>
              )}
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {(user.name?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <div>
                    {isEditingName === user.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={pendingName}
                          onChange={(event) => setPendingName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void submitNameChange();
                            }
                            if (event.key === "Escape") {
                              event.preventDefault();
                              cancelEditingName();
                            }
                          }}
                          placeholder="Name (optional)"
                          className="w-full max-w-[220px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)]"
                          aria-label={`Edit name for ${user.email}`}
                        />
                      </div>
                    ) : (
                      <p className="font-medium text-[var(--text-primary)]">
                        {user.name || "Unnamed"}
                      </p>
                    )}
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
                {onNameChange && (
                  <>
                    {isEditingName === user.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={submitNameChange}
                          disabled={isSavingName}
                          className={cn(
                            "btn btn-primary !px-3 !py-1 text-xs",
                            isSavingName && "opacity-60 cursor-wait"
                          )}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingName}
                          className="btn btn-ghost !px-3 !py-1 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditingName(user)}
                        className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                        title="Edit name"
                      >
                        <Pencil className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={2} />
                      </button>
                    )}
                  </>
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
