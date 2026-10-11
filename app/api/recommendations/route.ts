import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateCategoryPriorities } from "@/lib/priority";

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
    const priorities = await calculateCategoryPriorities(items, { from, to });

    return NextResponse.json({
      priorities,
      totalCount: items.length,
    });
  } catch (error) {
    console.error("GET /api/recommendations error:", error);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
