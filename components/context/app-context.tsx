"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
}

interface AppContextType {
  theme: "dark" | "light";
  toggleTheme: () => void;
  feedbackCount: number;
  qualityScore: number | null;
  isSeeding: boolean;
  loadSampleData: () => Promise<void>;
  resetAllData: () => Promise<void>;
  refreshCounts: () => Promise<void>;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  isImportOpen: boolean;
  setIsImportOpen: (open: boolean) => void;
  isAddFeedbackOpen: boolean;
  setIsAddFeedbackOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [feedbackCount, setFeedbackCount] = useState<number>(0);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isAddFeedbackOpen, setIsAddFeedbackOpen] = useState<boolean>(false);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    const initial = savedTheme || "dark";
    setTheme(initial);
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    refreshCounts();
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshCounts = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setFeedbackCount(data.totalFeedback || 0);
        if (data.latestJob?.quality_score) {
          setQualityScore(data.latestJob.quality_score);
        }
      }
    } catch {
      // ignore
    }
  };

  const loadSampleData = async () => {
    try {
      setIsSeeding(true);
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        addToast({
          type: "success",
          title: "Sample Data Ingested!",
          description: "200 customer feedback records loaded with Adaption Quality Gate (Score 94.8/100).",
        });
        await refreshCounts();
      } else {
        addToast({
          type: "error",
          title: "Failed to load sample data",
          description: data.error || "Unknown error",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Connection Error",
        description: err.message || "Failed to reach server",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const resetAllData = async () => {
    try {
      const res = await fetch("/api/seed", { method: "DELETE" });
      if (res.ok) {
        addToast({
          type: "info",
          title: "Database Cleared",
          description: "All feedback and import records have been reset.",
        });
        await refreshCounts();
      }
    } catch {
      // ignore
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        feedbackCount,
        qualityScore,
        isSeeding,
        loadSampleData,
        resetAllData,
        refreshCounts,
        toasts,
        addToast,
        removeToast,
        isImportOpen,
        setIsImportOpen,
        isAddFeedbackOpen,
        setIsAddFeedbackOpen,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-100"
                : toast.type === "error"
                ? "bg-rose-950/90 border-rose-500/50 text-rose-100"
                : toast.type === "warning"
                ? "bg-amber-950/90 border-amber-500/50 text-amber-100"
                : "bg-slate-900/90 border-slate-700/80 text-slate-100"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs mt-1 opacity-90 leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 text-xs text-white"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
