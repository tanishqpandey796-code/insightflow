"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Upload,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  Database,
  BarChart3,
  FileText,
  Star,
  Zap,
} from "lucide-react";
import { useApp } from "@/components/context/app-context";
import { AdaptionQualityCard } from "@/components/adaption-quality-card";
import { KpiCard } from "@/components/kpi-card";

export default function OverviewPage() {
  const { loadSampleData, isSeeding, feedbackCount, setIsImportOpen } = useApp();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setDashboardData(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [feedbackCount]);

  const kpis = dashboardData?.kpis;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Section */}
      <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-900/20 via-slate-900/60 to-purple-900/20 backdrop-blur-xl p-8 lg:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Frontend Arena · 48h Hackathon Solution</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Turn messy customer feedback into{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              prioritized decisions
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            Ingest raw reviews, surveys, and support tickets in seconds. Powered by{" "}
            <strong>Adaption Adaptive Data API</strong> to normalize noise & audit quality,
            coupled with multi-factor priority scoring so CX & Product managers know{" "}
            <em>what to fix first and why</em>.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3.5">
            <button
              onClick={loadSampleData}
              disabled={isSeeding}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSeeding ? "Ingesting Sample Data..." : "Load Sample Data (1-Click)"}</span>
            </button>

            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Import Your CSV</span>
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Feedback Processed"
          value={kpis?.total_feedback ?? 0}
          subtitle="Ingested via Adaption gate"
          icon={Database}
          color="indigo"
        />
        <KpiCard
          title="Customer Sentiment"
          value={kpis ? `${kpis.positive_pct}%` : "0%"}
          subtitle={`${kpis?.negative_pct ?? 0}% negative share`}
          badge={kpis ? `${kpis.positive_count} pos / ${kpis.negative_count} neg` : undefined}
          icon={TrendingUp}
          color="emerald"
        />
        <KpiCard
          title="Top Friction Category"
          value={kpis?.top_issue_category || "None"}
          subtitle={
            kpis?.top_issue_priority
              ? `Priority Score: ${kpis.top_issue_priority}/100`
              : "No issues identified"
          }
          icon={Lightbulb}
          color="rose"
        />
        <KpiCard
          title="Average Rating"
          value={kpis?.avg_rating ? `${kpis.avg_rating} ★` : "—"}
          subtitle="Across rated submissions"
          icon={Star}
          color="amber"
        />
      </div>

      {/* Adaption Spotlight Card */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">
            Data Quality & Preparation Pipeline
          </h2>
          <span className="text-xs text-indigo-400 font-semibold">
            Judged Adaption Layer
          </span>
        </div>
        <AdaptionQualityCard job={dashboardData?.latestJob || null} />
      </div>

      {/* 4-Step Core Flow Explanation */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            How InsightFlow Solves the Feedback Pile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            From raw, messy surveys and tickets to boardroom-ready prioritization in under 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center text-xs">
              01
            </span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Ingest & Column Map
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload CSV or load sample data. Automatic column detection maps text, date, rating, and sources.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-2.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              02
            </span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Adaption Gate</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Adaption Adaptive Data pipeline normalizes noise, strips artifact glyphs, and masks customer PII before classification.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center text-xs">
              03
            </span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              AI Priority Engine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Mathematical scoring formula combines complaint frequency, negative share, severity, and week-over-week trends.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center text-xs">
              04
            </span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Action & Executive Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              One-click track issues into Kanban, export Print-to-PDF reports, and share read-only executive snapshot links.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
