"use client";

import React from "react";
import { Search, Filter, RotateCcw } from "lucide-react";
import { CATEGORIES } from "@/types";

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  sentiment: string;
  onSentimentChange: (val: string) => void;
  source: string;
  onSourceChange: (val: string) => void;
  timeRange: string;
  onTimeRangeChange: (val: string) => void;
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
  onReset,
}: FilterBarProps) {
  const hasActiveFilters =
    search ||
    category !== "all" ||
    sentiment !== "all" ||
    source !== "all" ||
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
          placeholder="Search keywords, customer name, summary..."
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
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
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

        {/* Source */}
        <select
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
          className="text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 py-2 px-3 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Sources</option>
          <option value="review">Reviews</option>
          <option value="survey">Surveys</option>
          <option value="support">Support</option>
          <option value="social">Social Media</option>
        </select>

        {/* Time Range */}
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
          className="text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 py-2 px-3 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Time (90 Days)</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="60d">Last 60 Days</option>
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
