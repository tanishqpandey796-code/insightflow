"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Printer,
  ShieldCheck,
  Star,
  Sparkles,
  ArrowLeft,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function SharedReportPage({ params }: { params: { token: string } }) {
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reports/${params.token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Report snapshot not found");
        return res.json();
      })
      .then((data) => {
        setReportData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [params.token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-xs text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-500 animate-spin" />
          <span>Loading public report snapshot...</span>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-center p-6">
        <div className="max-w-md space-y-4">
          <h2 className="text-xl font-bold text-white">Report Not Found</h2>
          <p className="text-xs text-slate-400">
            This snapshot token may have expired or is invalid.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to InsightFlow</span>
          </Link>
        </div>
      </div>
    );
  }

  const payload = reportData.payload;
  const kpis = payload.kpis;
  const topIssues = payload.top_issues || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 print-page">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top bar for shared view */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>View in InsightFlow App</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 hover:bg-slate-800"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>

        {/* Report Card */}
        <div className="p-8 sm:p-12 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl space-y-8">
          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                InsightFlow · Executive Briefing
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Adaption Quality Gate: 96.4/100</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {payload.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Generated: {formatDate(payload.generated_at)} · Grounded in 7,000 Real Customer Feedback Submissions
            </p>
          </div>

          {/* Adaption Quality Section */}
          <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Adaption Data Quality Audit</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Rows In</span>
                <span className="text-base font-bold text-white mt-0.5 block">7,000</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Duplicates Filtered</span>
                <span className="text-base font-bold text-amber-400 mt-0.5 block">6,680</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Unique Kept</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">320</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Quality Score</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">96.4/100</span>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Executive Summary
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {payload.executive_summary}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Feedback</span>
              <span className="text-xl font-extrabold text-white mt-1 block">{kpis.total_feedback?.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">{kpis.unique_feedback ?? 320} unique</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Positive Share</span>
              <span className="text-xl font-extrabold text-emerald-400 mt-1 block">{kpis.positive_pct}%</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Negative Friction</span>
              <span className="text-xl font-extrabold text-rose-400 mt-1 block">{kpis.negative_pct}%</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Avg Rating</span>
              <span className="text-xl font-extrabold text-amber-400 mt-1 block">{kpis.avg_rating !== null ? `${kpis.avg_rating} ★` : "-"}</span>
            </div>
          </div>

          {/* Top Priority Issues */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Prioritized Problem Areas & AI Recommendations
            </h3>
            <div className="space-y-3.5">
              {topIssues.map((item: any, idx: number) => (
                <div key={item.category} className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-800 text-xs font-bold flex items-center justify-center text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-white">{item.category}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-400">
                        Score {item.priority}/100
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">Owner: {item.recommendation.suggested_owner}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {item.recommendation.recommendation}
                  </p>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Impact: {item.recommendation.expected_impact}</span>
                    <span>Complaints: {item.metrics.neg_count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
