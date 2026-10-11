"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface SentimentDonutProps {
  data: Array<{ name: string; value: number; color: string }>;
  positivePct: number;
}

export function SentimentDonut({ data, positivePct }: SentimentDonutProps) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No sentiment data available
      </div>
    );
  }

  return (
    <div className="h-64 relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              borderColor: "rgba(51, 65, 85, 0.8)",
              borderRadius: "0.75rem",
              fontSize: "12px",
              color: "#fff",
            }}
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={88}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {positivePct}%
        </span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Positive
        </span>
      </div>
    </div>
  );
}
