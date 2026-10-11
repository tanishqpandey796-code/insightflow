"use client";

import React from "react";
import {
  Upload,
  Plus,
  Sun,
  Moon,
  Sparkles,
  Database,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useApp } from "@/components/context/app-context";

export function Header() {
  const {
    theme,
    toggleTheme,
    feedbackCount,
    loadSampleData,
    isSeeding,
    resetAllData,
    setIsImportOpen,
    setIsAddFeedbackOpen,
  } = useApp();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <Database className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-slate-500 dark:text-slate-400">Dataset:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {feedbackCount} records
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Load Sample Data Button */}
        <button
          onClick={loadSampleData}
          disabled={isSeeding}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
          title="Load 200 realistic customer feedback items with rising trend"
        >
          {isSeeding ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{isSeeding ? "Loading Data..." : "Load Sample Data"}</span>
        </button>

        {/* Import CSV Button */}
        <button
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import CSV</span>
        </button>

        {/* Add Feedback Button */}
        <button
          onClick={() => setIsAddFeedbackOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/25 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Feedback</span>
        </button>

        {/* Reset Data Button (if records exist) */}
        {feedbackCount > 0 && (
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to clear all feedback?")) {
                resetAllData();
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Reset database"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>
      </div>
    </header>
  );
}
