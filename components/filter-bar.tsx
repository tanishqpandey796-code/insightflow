"use client";

import React from "react";
import { Search, RotateCcw } from "lucide-react";
import { CATEGORIES } from "@/types";

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  sentiment: string;
  onSentimentChange: (val: string) => void;
  source?: string;
  onSourceChange?: (val: string) => void;
  timeRange: string;
  onTimeRangeChange: (val: string) => void;
  hasRatings?: boolean;
  hasSources?: boolean;
  onReset: () => void;
}

export function FilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sentiment,
  onSentimentChange,
  source,
  onSourceChange,
  timeRange,
  onTimeRangeChange,
  hasRatings = false,
  hasSources = false,
  onReset,
}: FilterBarProps) {
  const hasActiveFilters =
    search ||
    category !== "all" ||
    sentiment !== "all" ||
    (source && source !== "all") ||
    timeRange !== "all";

  return (
    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search reviews, keywords, topics..."
          className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Select Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 py-2 px-3 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Categories (4)</option>
          {CATEGORIES.filter((c) => c !== "Other").map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Sentiment */}
        <select
          value={sentiment}
          onChange={(e) => onSentimentChange(e.target.value)}
          className="text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 py-2 px-3 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>

        {/* Source Filter (Only shown if sources exist in data) */}
        {hasSources && onSourceChange && (
          <select
            value={source || "all"}
            onChange={(e) => onSourceChange(e.target.value)}
            className="text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 py-2 px-3 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Sources</option>
            <option value="review">Reviews</option>
            <option value="survey">Surveys</option>
            <option value="support">Support</option>
          </select>
        )}

        {/* Time Range - Clearly labeled simulated timeline */}
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
          className="text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 py-2 px-3 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
          title="Dataset has no native timestamps; timeline is simulated over 90 days"
        >
          <option value="all">Simulated timeline (all 90 days)</option>
          <option value="45d">Recent 45 days</option>
          <option value="14d">Recent 14 days</option>
        </select>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 font-medium transition-colors"
            title="Reset filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
