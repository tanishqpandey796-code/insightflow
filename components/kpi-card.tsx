"use client";

import React from "react";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // percentage
  trendLabel?: string;
  icon: LucideIcon;
  badge?: string;
  color?: "indigo" | "emerald" | "amber" | "rose" | "purple";
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  badge,
  color = "indigo",
}: KpiCardProps) {
  const colorMap = {
    indigo: "from-indigo-600/20 to-indigo-600/5 text-indigo-500 border-indigo-500/20",
    emerald: "from-emerald-600/20 to-emerald-600/5 text-emerald-500 border-emerald-500/20",
    amber: "from-amber-600/20 to-amber-600/5 text-amber-500 border-amber-500/20",
    rose: "from-rose-600/20 to-rose-600/5 text-rose-500 border-rose-500/20",
    purple: "from-purple-600/20 to-purple-600/5 text-purple-500 border-purple-500/20",
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colorMap[color]} border flex items-center justify-center`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend !== undefined) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                trend > 0
                  ? "text-rose-500 dark:text-rose-400"
                  : trend < 0
                  ? "text-emerald-500 dark:text-emerald-400"
                  : "text-slate-400"
              }`}
            >
              {trend > 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
          <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
            {trendLabel || subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
