"use client";

import React, { useEffect, useState } from "react";
import {
  MessageSquareText,
  Plus,
  Upload,
  RefreshCw,
} from "lucide-react";
import { Feedback } from "@/types";
import { FeedbackTable } from "@/components/feedback-table";
import { FilterBar } from "@/components/filter-bar";
import { useApp } from "@/components/context/app-context";

export default function FeedbackPage() {
  const { feedbackCount, setIsImportOpen, setIsAddFeedbackOpen, addToast } = useApp();
  const [items, setItems] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [totalWeighted, setTotalWeighted] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sentiment, setSentiment] = useState("all");
  const [source, setSource] = useState("all");
  const [timeRange, setTimeRange] = useState("all");

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (search) params.set("q", search);
      if (category !== "all") params.set("category", category);
      if (sentiment !== "all") params.set("sentiment", sentiment);
      if (source !== "all") params.set("source", source);

      if (timeRange !== "all") {
        const now = new Date();
        const days = timeRange === "14d" ? 14 : 45;
        const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        params.set("from", fromDate.toISOString());
      }

      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalWeighted(data.totalWeighted || data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [page, search, category, sentiment, source, timeRange, feedbackCount]);

  const handleResetFilters = () => {
    setSearch("");
    setCategory("all");
    setSentiment("all");
    setSource("all");
    setTimeRange("all");
    setPage(1);
  };

  const handleRerunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        addToast({
          type: "success",
          title: "Analysis Re-run Complete",
          description: data.message || "Feedback re-classified successfully.",
        });
        fetchFeedback();
      }
    } catch {
      addToast({ type: "error", title: "Analysis failed" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <MessageSquareText className="w-6 h-6 text-indigo-500" />
            <span>Customer Feedback Explorer</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse, search, and filter unique reviews with occurrence frequency and severity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRerunAnalysis}
            disabled={isAnalyzing || items.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            title="Re-run AI sentiment and categorization"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
            <span>{isAnalyzing ? "Analyzing..." : "Re-run Analysis"}</span>
          </button>

          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setIsAddFeedbackOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Single</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        category={category}
        onCategoryChange={(val) => {
          setCategory(val);
          setPage(1);
        }}
        sentiment={sentiment}
        onSentimentChange={(val) => {
          setSentiment(val);
          setPage(1);
        }}
        source={source}
        onSourceChange={(val) => {
          setSource(val);
          setPage(1);
        }}
        timeRange={timeRange}
        onTimeRangeChange={(val) => {
          setTimeRange(val);
          setPage(1);
        }}
        hasRatings={false}
        hasSources={false}
        onReset={handleResetFilters}
      />

      {/* Main Table */}
      <FeedbackTable
        items={items}
        total={total}
        totalWeighted={totalWeighted}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        isLoading={isLoading}
      />
    </div>
  );
}
