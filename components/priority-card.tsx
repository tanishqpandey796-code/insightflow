"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Quote,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { PriorityItem } from "@/types";
import { useApp } from "@/components/context/app-context";

interface PriorityCardProps {
  item: PriorityItem;
  rank: number;
  onTrackIssue?: () => void;
}

export function PriorityCard({ item, rank, onTrackIssue }: PriorityCardProps) {
  const { addToast } = useApp();
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [isTracked, setIsTracked] = useState(false);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "Critical":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "High":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      default:
        return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
    }
  };

  const handleTrack = async () => {
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.recommendation.title || `${item.category} Friction Spike`,
          category: item.category,
          status: "open",
          priority_score: item.priority,
          notes: `Tracked from Decision Engine. Suggested owner: ${item.recommendation.suggested_owner}.`,
          snapshot: {
            category: item.category,
            priority_score: item.priority,
            negative_count: item.metrics.neg_count,
            total_feedback: item.metrics.category_total,
            avg_severity: item.metrics.avg_severity,
            trend_percent: item.metrics.trend_percent,
            trend_label: item.metrics.trend_display,
            top_quotes: item.quotes,
          },
        }),
      });

      if (res.ok) {
        setIsTracked(true);
        addToast({
          type: "success",
          title: "Issue Tracked",
          description: `Created new tracked issue for ${item.category} on the Issues Board.`,
        });
        if (onTrackIssue) onTrackIssue();
      }
    } catch {
      addToast({
        type: "error",
        title: "Failed to track issue",
      });
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        item.level === "Critical"
          ? "border-rose-500/30 bg-gradient-to-br from-rose-950/20 via-slate-900/60 to-slate-950/80 shadow-lg shadow-rose-950/20"
          : item.level === "High"
          ? "border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-900/60 to-slate-950/80 shadow-md shadow-amber-950/10"
          : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm"
      }`}
    >
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs">
              #{rank}
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {item.category}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getLevelBadge(
                    item.level
                  )}`}
                >
                  {item.level} Priority
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {item.metrics.neg_count.toLocaleString()} negative complaints ({Math.round(item.components.neg_share * 100)}% of category feedback)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                Score
              </span>
              <span
                className={`text-xl font-extrabold ${
                  item.priority >= 70
                    ? "text-rose-400"
                    : item.priority >= 40
                    ? "text-amber-400"
                    : "text-indigo-400"
                }`}
              >
                {item.priority}
              </span>
              <span className="text-xs text-slate-500">/100</span>
            </div>

            <button
              onClick={handleTrack}
              disabled={isTracked}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isTracked
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 active:scale-95"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isTracked ? "Tracked" : "Track this issue"}</span>
            </button>
          </div>
        </div>

        {/* AI Actionable Recommendation */}
        <div className="p-4 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-500/20 space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {item.recommendation.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 uppercase">
                Effort: {item.recommendation.effort}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Owner: {item.recommendation.suggested_owner}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {item.recommendation.recommendation}
          </p>

          <div className="pt-1 flex items-center justify-between text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
            <span>Expected impact: {item.recommendation.expected_impact}</span>
            <span className="flex items-center gap-1 text-slate-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trend: {item.metrics.trend_display}</span>
            </span>
          </div>
        </div>

        {/* Real Customer Quotes from Dataset */}
        {item.quotes && item.quotes.length > 0 && (
          <div className="space-y-2 mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Representative Customer Reviews (from Dataset)
            </span>
            <div className="grid grid-cols-1 gap-2">
              {item.quotes.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 italic"
                >
                  <Quote className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5 not-italic" />
                  <span>"{q}"</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expandable 'Why this matters' panel with exact score components */}
        <div className="pt-2">
          <button
            onClick={() => setIsWhyOpen(!isWhyOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Why this matters (Formula & Score Breakdown)</span>
            {isWhyOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {isWhyOpen && (
            <div className="mt-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-3 animate-fade-in">
              <p className="text-slate-400 leading-relaxed">
                The Priority Engine uses multi-factor weighting:{" "}
                <code className="text-indigo-300 font-mono text-[11px]">
                  Priority = 100 × (0.35×freq + 0.25×neg_share + 0.20×severity + 0.20×trend)
                </code>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2 rounded-lg bg-slate-800/80">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                    Frequency (35%)
                  </span>
                  <span className="text-sm font-bold text-white">
                    {item.components.freq}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {item.metrics.neg_count.toLocaleString()}/{item.metrics.max_neg_count.toLocaleString()} max
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-800/80">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                    Neg Share (25%)
                  </span>
                  <span className="text-sm font-bold text-white">
                    {item.components.neg_share}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {Math.round(item.components.neg_share * 100)}% of category
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-800/80">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                    Severity (20%)
                  </span>
                  <span className="text-sm font-bold text-white">
                    {item.components.severity}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {item.metrics.avg_severity} / 5.0
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-800/80">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                    Trend (20%)
                  </span>
                  <span className="text-sm font-bold text-white">
                    {item.components.trend}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {item.metrics.trend_display}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
