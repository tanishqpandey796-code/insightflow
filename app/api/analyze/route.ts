import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeFeedbackRows } from "@/lib/analyze";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { jobId, limit } = body;

    const unanalyzed = db.feedback.getUnanalyzed(limit || 100, jobId);
    if (unanalyzed.length === 0) {
      return NextResponse.json({ processed: 0, message: "No unanalyzed feedback found" });
    }

    const processed = await analyzeFeedbackRows(unanalyzed);
    const remaining = db.feedback.getUnanalyzed(1, jobId).length;

    return NextResponse.json({
      processed,
      remaining,
      message: `Successfully analyzed ${processed} feedback records.`,
    });
  } catch (error) {
    console.error("POST /api/analyze error:", error);
    return NextResponse.json({ error: "Failed to run analysis" }, { status: 500 });
  }
}
