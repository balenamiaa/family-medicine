"use client";

import { cn } from "@/lib/utils";

interface StatsOverviewProps {
  stats: {
    totals: {
      users: number;
      studySets: number;
      cards: number;
      progress: number;
    };
    byType: {
      sets: Record<string, number>;
      users: Record<string, number>;
    };
    recent: {
      usersLast30Days: number;
      setsLast30Days: number;
    };
  };
}

const statCards = [
  {
    key: "users" as const,
    label: "Total Users",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: "from-indigo-500 to-purple-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  {
    key: "studySets" as const,
    label: "Study Sets",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: "from-teal-500 to-emerald-600",
    bgColor: "bg-teal-50 dark:bg-teal-900/20",
  },
  {
    key: "cards" as const,
    label: "Total Cards",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    key: "progress" as const,
    label: "Study Sessions",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: "from-rose-500 to-pink-600",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
  },
];

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Main stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className={cn(
              "card p-6 relative overflow-hidden group",
              "hover:shadow-lg transition-all duration-300"
            )}
          >
            {/* Gradient background decoration */}
            <div className={cn(
              "absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10",
              "bg-gradient-to-br",
              card.color
            )} />

            <div className="relative">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", card.bgColor)}>
                <span className={cn("bg-gradient-to-br bg-clip-text text-transparent", card.color)}>
                  {card.icon}
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-1">{card.label}</p>
              <p className="text-3xl font-display font-bold text-[var(--text-primary)]">
                {stats.totals[card.key].toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sets by type */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4">Sets by Type</h3>
          <div className="space-y-3">
            {Object.entries(stats.byType.sets).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    type === "SYSTEM" && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
                    type === "PUBLIC" && "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
                    type === "PRIVATE" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  )}>
                    {type}
                  </span>
                </div>
                <span className="text-lg font-semibold text-[var(--text-primary)]">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Users by role */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4">Users by Role</h3>
          <div className="space-y-3">
            {Object.entries(stats.byType.users).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    role === "ADMIN" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
                    role === "USER" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  )}>
                    {role}
                  </span>
                </div>
                <span className="text-lg font-semibold text-[var(--text-primary)]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">New users (30 days)</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.recent.usersLast30Days}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-teal-500/5 to-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">New sets (30 days)</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.recent.setsLast30Days}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
