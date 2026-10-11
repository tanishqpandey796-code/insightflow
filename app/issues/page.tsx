"use client";

import React, { useEffect, useState } from "react";
import { CheckSquare, Plus, RefreshCw, Sparkles } from "lucide-react";
import { Issue } from "@/types";
import { IssueKanban } from "@/components/issue-kanban";
import { useApp } from "@/components/context/app-context";

export default function IssuesPage() {
  const { addToast } = useApp();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("App/Website Bugs");
  const [newPriority, setNewPriority] = useState(70);

  const fetchIssues = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/issues");
      if (res.ok) {
        const data = await res.json();
        setIssues(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleCreateCustomIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          status: "open",
          priority_score: newPriority,
          notes: "Manually created task.",
          snapshot: null,
        }),
      });

      if (res.ok) {
        addToast({ type: "success", title: "Custom Issue Created" });
        setNewTitle("");
        setIsNewDialogOpen(false);
        fetchIssues();
      }
    } catch {
      addToast({ type: "error", title: "Failed to create issue" });
    }
  };

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-indigo-500" />
            <span>Product & Engineering Issue Tracker</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track, update, and resolve friction bottlenecks tied directly to customer feedback.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Issue</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-slate-400">
          <Sparkles className="w-6 h-6 text-indigo-500 animate-spin" />
          <span>Loading tracked issues...</span>
        </div>
      ) : (
        <IssueKanban issues={issues} onRefresh={fetchIssues} />
      )}

      {/* Create Modal */}
      {isNewDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Create Custom Tracked Issue
            </h3>
            <form onSubmit={handleCreateCustomIssue} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Issue Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Patch memory leak in checkout bundle"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="App/Website Bugs">App/Website Bugs</option>
                  <option value="Product Quality">Product Quality</option>
                  <option value="Delivery & Shipping">Delivery & Shipping</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Pricing & Billing">Pricing & Billing</option>
                  <option value="Usability/UX">Usability/UX</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Priority Score: {newPriority} / 100
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={newPriority}
                  onChange={(e) => setNewPriority(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewDialogOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                >
                  Save Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
