import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { aggregateDashboardData } from "@/lib/aggregate";
import { calculateCategoryPriorities } from "@/lib/priority";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = body.title || `Executive Feedback Report — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    const feedbackList = db.feedback.getAll();
    const { kpis, charts } = await aggregateDashboardData(feedbackList);
    const priorities = await calculateCategoryPriorities(feedbackList);
    const trackedIssues = db.issues.list();

    const topIssues = priorities.slice(0, 5);
    const categoryBreakdown = charts.top_categories.map((c) => ({
      name: c.name,
      count: c.total,
      negative_count: c.negative,
      positive_count: c.positive,
      avg_rating: 0,
    }));

    const topIssue = topIssues[0];
    const executiveSummary = topIssue
      ? `This report analyzes ${kpis.total_feedback} customer touchpoints. The primary bottleneck is ${topIssue.category} (Priority Score ${topIssue.priority}/100, ${topIssue.metrics.neg_count} negative reports), with a recent ${topIssue.metrics.trend_percent > 0 ? "+" : ""}${topIssue.metrics.trend_percent}% escalation. Immediate intervention is advised to prevent customer churn and recover NPS.`
      : `Analysis of ${kpis.total_feedback} feedback entries reveals steady sentiment with overall ${kpis.positive_pct}% positive feedback.`;

    const token = `rep_${crypto.randomBytes(8).toString("hex")}`;

    const report = db.reports.create({
      share_token: token,
      title,
      payload: {
        title,
        generated_at: new Date().toISOString(),
        kpis,
        top_issues: topIssues,
        tracked_issues: trackedIssues,
        category_breakdown: categoryBreakdown,
        executive_summary: executiveSummary,
      },
    });

    return NextResponse.json({
      success: true,
      token,
      id: report.id,
      title: report.title,
    });
  } catch (error) {
    console.error("POST /api/reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
