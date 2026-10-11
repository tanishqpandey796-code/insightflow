"use client";

import React, { useState } from "react";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Star,
  Sparkles,
  ShieldCheck,
  Tag,
  Calendar,
  User,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { Feedback } from "@/types";
import { formatDate } from "@/lib/utils";
import { exportFeedbackToCSV } from "@/lib/csv";
import { useApp } from "@/components/context/app-context";

interface FeedbackTableProps {
  items: Feedback[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
}

export function FeedbackTable({
  items,
  total,
  page,
  pageSize,
  onPageChange,
  isLoading,
}: FeedbackTableProps) {
  const { loadSampleData, isSeeding, setIsImportOpen, setIsAddFeedbackOpen } = useApp();
  const [selectedItem, setSelectedItem] = useState<Feedback | null>(null);

  const totalPages = Math.ceil(total / pageSize) || 1;

  const handleExport = () => {
    if (!items.length) return;
    const csvStr = exportFeedbackToCSV(items);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `feedback_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSentimentBadge = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive":
        return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
      case "negative":
        return "bg-rose-500/15 text-rose-500 border-rose-500/30";
      default:
        return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Showing <strong>{items.length}</strong> of <strong>{total}</strong> entries
        </span>
        <button
          onClick={handleExport}
          disabled={items.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Feedback</th>
                <th className="py-3.5 px-4">Sentiment</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Sparkles className="w-6 h-6 text-indigo-500 animate-spin" />
                      <span>Loading customer feedback...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                        <FileSpreadsheet className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                        No feedback records found
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                        Get started by loading the 200-row realistic sample dataset or importing your CSV file.
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={loadSampleData}
                          disabled={isSeeding}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 active:scale-95 disabled:opacity-50"
                        >
                          {isSeeding ? "Ingesting Sample Data..." : "Load Sample Data (200 Rows)"}
                        </button>
                        <button
                          onClick={() => setIsImportOpen(true)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                        >
                          Import CSV
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {item.cleaned_text || item.text}
                      </p>
                      {item.summary && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {item.summary}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border capitalize ${getSentimentBadge(
                          item.sentiment
                        )}`}
                      >
                        {item.sentiment || "neutral"}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.category || "Unclassified"}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.rating ? (
                        <div className="flex items-center gap-1 text-amber-400 font-semibold">
                          <span>{item.rating}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap capitalize text-slate-600 dark:text-slate-400">
                      {item.source}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {item.customer || "Anonymous"}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {formatDate(item.created_at)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {total > pageSize && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Row Detail Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${getSentimentBadge(
                      selectedItem.sentiment
                    )}`}
                  >
                    {selectedItem.sentiment || "neutral"}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                    {selectedItem.category || "Unclassified"}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Feedback Text */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Customer Feedback
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
                  "{selectedItem.cleaned_text || selectedItem.text}"
                </div>
              </div>

              {/* Raw vs Cleaned if different */}
              {selectedItem.cleaned_text && selectedItem.cleaned_text !== selectedItem.text && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Original Raw Input (Before Adaption)</span>
                  </h4>
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 text-xs text-slate-300 font-mono">
                    {selectedItem.text}
                  </div>
                </div>
              )}

              {/* Summary */}
              {selectedItem.summary && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    AI Summary
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    {selectedItem.summary}
                  </p>
                </div>
              )}

              {/* Topics / Keywords */}
              {selectedItem.topics && selectedItem.topics.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Extracted Topics</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.topics.map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata Attributes */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>Severity Rating:</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedItem.severity || 1} / 5
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Customer:</span>
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {selectedItem.customer || "Anonymous"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Feedback Date:</span>
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {formatDate(selectedItem.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
