"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Trash2,
  Edit3,
  Quote,
  Sparkles,
} from "lucide-react";
import { Issue, IssueStatus } from "@/types";
import { formatDate } from "@/lib/utils";
import { useApp } from "@/components/context/app-context";

interface IssueKanbanProps {
  issues: Issue[];
  onRefresh: () => void;
}

export function IssueKanban({ issues, onRefresh }: IssueKanbanProps) {
  const { addToast } = useApp();
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>("");

  const updateStatus = async (id: string, status: IssueStatus) => {
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        addToast({
          type: "success",
          title: "Status Updated",
          description: `Issue moved to ${status.replace("_", " ")}.`,
        });
        onRefresh();
      }
    } catch {
      addToast({ type: "error", title: "Failed to update status" });
    }
  };

  const saveNotes = async (id: string) => {
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText }),
      });
      if (res.ok) {
        addToast({ type: "success", title: "Notes Saved" });
        setEditingNotesId(null);
        onRefresh();
      }
    } catch {
      addToast({ type: "error", title: "Failed to save notes" });
    }
  };

  const deleteIssue = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this tracked issue?")) return;
    try {
      const res = await fetch(`/api/issues/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast({ type: "info", title: "Issue Removed" });
        onRefresh();
      }
    } catch {
      addToast({ type: "error", title: "Failed to delete" });
    }
  };

  const columns: Array<{ id: IssueStatus; title: string; color: string; icon: any }> = [
    { id: "open", title: "Open Issues", color: "text-amber-500 border-amber-500/30", icon: Clock },
    { id: "in_progress", title: "In Progress", color: "text-indigo-500 border-indigo-500/30", icon: Sparkles },
    { id: "resolved", title: "Resolved", color: "text-emerald-500 border-emerald-500/30", icon: CheckCircle2 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {columns.map((col) => {
        const colIssues = issues.filter((i) => i.status === col.id);
        const Icon = col.icon;

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${col.color}`} />
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {col.title}
                </h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {colIssues.length}
              </span>
            </div>

            {/* Column Issues List */}
            <div className="space-y-3.5 flex-1">
              {colIssues.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  No issues in this column
                </div>
              ) : (
                colIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                        {issue.title}
                      </h4>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          issue.priority_score >= 70
                            ? "bg-rose-500/15 text-rose-500"
                            : issue.priority_score >= 40
                            ? "bg-amber-500/15 text-amber-500"
                            : "bg-indigo-500/15 text-indigo-400"
                        }`}
                      >
                        {issue.priority_score}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {issue.category}
                      </span>
                      {issue.snapshot && (
                        <span className="text-[10px] text-slate-400">
                          {issue.snapshot.negative_count} complaints logged
                        </span>
                      )}
                    </div>

                    {/* Snapshot Quote Preview if available */}
                    {issue.snapshot?.top_quotes?.[0] && (
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/50 text-[11px] text-slate-600 dark:text-slate-400 italic flex items-start gap-1.5 border border-slate-100 dark:border-slate-800/60">
                        <Quote className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5 not-italic" />
                        <span className="line-clamp-2">"{issue.snapshot.top_quotes[0]}"</span>
                      </div>
                    )}

                    {/* Notes Editor */}
                    <div className="pt-1">
                      {editingNotesId === issue.id ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="px-2 py-1 text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveNotes(issue.id)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-semibold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px]">
                          <p className="text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                            {issue.notes || "No notes added yet..."}
                          </p>
                          <button
                            onClick={() => {
                              setEditingNotesId(issue.id);
                              setNoteText(issue.notes || "");
                            }}
                            className="text-slate-400 hover:text-indigo-400 p-1"
                            title="Edit notes"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Move Status Buttons */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <select
                        value={issue.status}
                        onChange={(e) => updateStatus(issue.id, e.target.value as IssueStatus)}
                        className="text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border-none py-1 px-2 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>

                      <button
                        onClick={() => deleteIssue(issue.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                        title="Delete issue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
