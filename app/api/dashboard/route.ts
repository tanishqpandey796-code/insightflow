import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aggregateDashboardData } from "@/lib/aggregate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || undefined;
    const source = searchParams.get("source") || undefined;
    const sentiment = searchParams.get("sentiment") || undefined;
    const category = searchParams.get("category") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const items = db.feedback.getAll({ q, source, sentiment, category, from, to });
    const { kpis, charts } = await aggregateDashboardData(items, { q, source, sentiment, category, from, to });
    const latestJob = db.importJobs.getLatest();

    return NextResponse.json({
      kpis,
      charts,
      latestJob,
      totalFeedback: items.length,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Failed to aggregate dashboard data" }, { status: 500 });
  }
}
