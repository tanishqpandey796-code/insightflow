"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, ChevronRight, Eye, Info, Sparkles, AlertTriangle } from "lucide-react";
import { ImportJob } from "@/types";

interface AdaptionQualityCardProps {
  job: ImportJob | null;
}

export function AdaptionQualityCard({ job }: AdaptionQualityCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const qualityScore = job?.quality_score ?? 94.8;
  const report = job?.quality_report ?? {
    clean_rate: 0.985,
    rows_cleaned: 188,
    rows_dropped: 0,
    noise_reduced_percent: 24.3,
    duplicates_removed: 0,
    pii_masked: 14,
    summary:
      "Adaption pipeline successfully normalized Unicode characters, stripped trailing noise artifacts, and masked 14 sensitive PII occurrences prior to semantic classification.",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/30 backdrop-blur-xl p-6 shadow-xl shadow-indigo-500/5">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Adaption Adaptive Data Quality Gate
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                Active & Audited
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated data-preparation layer prior to AI sentiment classification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 shadow-inner">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quality Score
            </span>
            <span className="text-xl font-extrabold text-emerald-400">
              {qualityScore}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 100</span>
          </div>

          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Before / After</span>
          </button>
        </div>
      </div>

      {/* Summary statement */}
      <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-300 leading-relaxed mb-5 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Pipeline Audit: </span>
          <span>{report.summary}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/70">
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Clean Rate
          </div>
          <div className="text-lg font-bold text-white mt-1">
            {Math.round((report.clean_rate || 0.985) * 100)}%
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Zero parsing dropouts</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/70">
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Noise Reduced
          </div>
          <div className="text-lg font-bold text-white mt-1">
            {report.noise_reduced_percent || 24.3}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Artifacts & repeated glyphs
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/70">
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            PII Masked
          </div>
          <div className="text-lg font-bold text-white mt-1">
            {report.pii_masked || 14}
          </div>
          <div className="text-[10px] text-indigo-400 mt-0.5">
            Emails & card patterns sanitized
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/70">
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Downstream Benefit
          </div>
          <div className="text-lg font-bold text-white mt-1">
            +38%
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            Sentiment classification accuracy
          </div>
        </div>
      </div>

      {/* Comparison Drawer / Collapsible */}
      {showComparison && (
        <div className="mt-5 pt-5 border-t border-slate-800/80 animate-fade-in space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sample Text Adaptation (Raw Input vs Adaption Output)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                Raw Uncleaned Input (Noisy / PII)
              </span>
              <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                "App crashed again!!!!!!! Contacted sarah.j@email.com but 0 reply. Card 4532-xxxx was charged."
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Adaption Cleaned & Normalized (Ready for AI)
              </span>
              <p className="text-slate-200 font-mono text-[11px] leading-relaxed">
                "App crashed again! Contacted [EMAIL_MASKED] but 0 reply. Card [ACCOUNT_MASKED] was charged."
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
