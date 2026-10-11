"use client";

import React, { useEffect, useState } from "react";
import { Lightbulb, Sparkles, Filter, AlertOctagon, CheckCircle2 } from "lucide-react";
import { PriorityItem } from "@/types";
import { PriorityCard } from "@/components/priority-card";
import { useApp } from "@/components/context/app-context";

export default function RecommendationsPage() {
  const { feedbackCount } = useApp();
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPriorities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/recommendations");
      if (res.ok) {
        const data = await res.json();
        setPriorities(data.priorities || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPriorities();
  }, [feedbackCount]);

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <span>Intelligent Decision & Priority Engine</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prioritized issues ranked by frequency, negative share, severity, and escalation velocity.
          </p>
        </div>

        {priorities.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              {priorities.filter((p) => p.level === "Critical").length} Critical Bottlenecks
            </span>
          </div>
        )}
      </div>

      {/* Priority Scoring Methodology Banner */}
      <div className="p-4 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Transparent Priority Formula:</span>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Recommendations are grounded strictly in your ingested customer feedback.
            Priority scores (0–100) are computed mathematically via:{" "}
            <code className="text-indigo-300 font-mono text-[11px]">
              100 × (0.35×Frequency + 0.25×Negative Share + 0.20×Severity + 0.20×Trend)
            </code>
            . Expand any issue below to inspect the driving numbers.
          </p>
        </div>
      </div>

      {/* List of Prioritized Issues */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-slate-400">
          <Sparkles className="w-6 h-6 text-indigo-500 animate-spin" />
          <span>Computing multi-factor priority scores & recommendations...</span>
        </div>
      ) : priorities.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
          No feedback data available to score. Please load sample data or import a CSV.
        </div>
      ) : (
        <div className="space-y-4">
          {priorities.map((item, index) => (
            <PriorityCard
              key={item.category}
              item={item}
              rank={index + 1}
              onTrackIssue={fetchPriorities}
            />
          ))}
        </div>
      )}
    </div>
  );
}
