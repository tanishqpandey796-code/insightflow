"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareText,
  Lightbulb,
  CheckSquare,
  FileText,
  Home,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/components/context/app-context";

const navItems = [
  { name: "Overview", href: "/", icon: Home },
  { name: "Feedback", href: "/feedback", icon: MessageSquareText },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Recommendations", href: "/recommendations", icon: Lightbulb },
  { name: "Issues Tracker", href: "/issues", icon: CheckSquare },
  { name: "Executive Report", href: "/report", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { feedbackCount, uniqueCount, qualityScore } = useApp();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl flex flex-col justify-between h-screen sticky top-0 z-30 transition-colors">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                InsightFlow
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-indigo-500 uppercase">
                Adaptive Feedback AI
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
                  <span>{item.name}</span>
                </div>
                {item.href === "/feedback" && feedbackCount > 0 && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? "bg-indigo-700 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {feedbackCount.toLocaleString()}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Adaption Status Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Adaption Data Gate
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
            Consolidated 7,000 reviews into 320 unique vectors with Quality Score.
          </p>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">Quality Score</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">
              {qualityScore ? `${qualityScore}/100` : "96.4/100"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
