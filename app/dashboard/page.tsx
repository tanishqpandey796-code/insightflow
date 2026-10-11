"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  MessageSquare,
  Star,
  AlertTriangle,
  Database,
  ShieldCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { FilterBar } from "@/components/filter-bar";
import { SentimentDonut } from "@/components/charts/sentiment-donut";
import { SentimentTimeline } from "@/components/charts/sentiment-timeline";
import { VolumeTimeline } from "@/components/charts/volume-timeline";
import { CategoryBar } from "@/components/charts/category-bar";
import { ComplaintTopicsChart } from "@/components/charts/complaint-topics";
import { AdaptionQualityCard } from "@/components/adaption-quality-card";
import { useApp } from "@/components/context/app-context";

export default function DashboardPage() {
  const { feedbackCount } = useApp();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sentiment, setSentiment] = useState("all");
  const [source, setSource] = useState("all");
  const [timeRange, setTimeRange] = useState("all");

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (category !== "all") params.set("category", category);
      if (sentiment !== "all") params.set("sentiment", sentiment);
      if (source !== "all") params.set("source", source);

      if (timeRange !== "all") {
        const now = new Date();
        const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 60;
        const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        params.set("from", fromDate.toISOString());
      }

      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [search, category, sentiment, source, timeRange, feedbackCount]);

  const handleResetFilters = () => {
    setSearch("");
    setCategory("all");
    setSentiment("all");
    setSource("all");
    setTimeRange("all");
  };

  const kpis = data?.kpis;
  const charts = data?.charts;

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-indigo-500" />
            <span>CX & Product Analytics Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time trends, sentiment distribution, and emerging friction patterns.
          </p>
        </div>
      </div>

      {/* Global Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sentiment={sentiment}
        onSentimentChange={setSentiment}
        source={source}
        onSourceChange={setSource}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onReset={handleResetFilters}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Feedback Volume"
          value={kpis?.total_feedback ?? 0}
          trend={kpis?.week_over_week_change}
          trendLabel="vs previous 7 days"
          icon={Database}
          color="indigo"
        />
        <KpiCard
          title="Net Positive Sentiment"
          value={kpis ? `${kpis.positive_pct}%` : "0%"}
          subtitle={`${kpis?.neutral_pct ?? 0}% neutral · ${kpis?.negative_pct ?? 0}% negative`}
          icon={TrendingUp}
          color="emerald"
        />
        <KpiCard
          title="Average Customer Rating"
          value={kpis?.avg_rating ? `${kpis.avg_rating} / 5.0` : "—"}
          subtitle={`Average score: ${kpis?.avg_sentiment ?? 0} (-1 to 1)`}
          icon={Star}
          color="amber"
        />
        <KpiCard
          title="Highest Escalation Category"
          value={kpis?.top_issue_category || "None"}
          subtitle={
            kpis?.top_issue_priority
              ? `Priority Score: ${kpis.top_issue_priority}/100`
              : "No issues identified"
          }
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Adaption Data Quality Gate Banner */}
      <AdaptionQualityCard job={data?.latestJob || null} />

      {/* Charts Row 1: Sentiment Donut & Sentiment Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Sentiment Distribution
            </h3>
            <span className="text-[11px] text-slate-400">Total {kpis?.total_feedback || 0}</span>
          </div>
          <SentimentDonut
            data={charts?.sentiment_distribution || []}
            positivePct={kpis?.positive_pct || 0}
          />
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <span className="block text-[10px] text-emerald-500 font-bold">Positive</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {kpis?.positive_count ?? 0}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-amber-500 font-bold">Neutral</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {kpis?.neutral_count ?? 0}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-rose-500 font-bold">Negative</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {kpis?.negative_count ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Sentiment Over Time Line Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Sentiment Trends Over Time
            </h3>
            <span className="text-[11px] text-slate-400">Daily trajectory</span>
          </div>
          <SentimentTimeline data={charts?.sentiment_over_time || []} />
        </div>
      </div>

      {/* Charts Row 2: Categories Breakdown & Top Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Bar Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Category Friction vs Positive
            </h3>
            <span className="text-[11px] text-slate-400">By feedback count</span>
          </div>
          <CategoryBar data={charts?.top_categories || []} />
        </div>

        {/* Top Complaint Topics */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Top Negative Complaint Keywords
            </h3>
            <span className="text-[11px] text-rose-400 font-semibold">Extracted topics</span>
          </div>
          <ComplaintTopicsChart data={charts?.top_complaints || []} />
        </div>
      </div>

      {/* Feedback Volume Area Timeline */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Ingestion Volume Timeline
          </h3>
          <span className="text-[11px] text-slate-400">Total historical density</span>
        </div>
        <VolumeTimeline data={charts?.volume_over_time || []} />
      </div>
    </div>
  );
}
