import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { cleanTextLocally } from "@/lib/adaption";
import { analyzeFeedbackRuleBased } from "@/lib/fallback";
import { llmClient } from "@/lib/llm";

export const dynamic = "force-dynamic";

const feedbackSchema = z.object({
  text: z.string().min(1, "Feedback text is required").max(5000),
  source: z.enum(["review", "survey", "support", "social", "other"]).default("review"),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  customer: z.string().max(200).nullable().optional(),
  created_at: z.string().datetime().optional(),
  autoAnalyze: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || undefined;
    const source = searchParams.get("source") || undefined;
    const sentiment = searchParams.get("sentiment") || undefined;
    const category = searchParams.get("category") || undefined;
    const rating = searchParams.get("rating") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    const result = db.feedback.list({
      q,
      source,
      sentiment,
      category,
      rating,
      from,
      to,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/feedback error:", error);
    return NextResponse.json({ error: "Failed to retrieve feedback" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { text, source, rating, customer, created_at, autoAnalyze } = parsed.data;

    // Apply local adaptive cleaning on the single entry
    const localCleaning = cleanTextLocally(text);

    let analysis: any = null;
    if (autoAnalyze) {
      // Try LLM or fallback
      if (llmClient.isConfigured()) {
        const batchRes = await llmClient.analyzeFeedbackBatch([
          { id: "new", text: localCleaning.cleaned, rating: rating || null },
        ]);
        if (batchRes && batchRes.length > 0) {
          analysis = batchRes[0];
        }
      }

      if (!analysis) {
        analysis = analyzeFeedbackRuleBased(localCleaning.cleaned, rating || null);
      }
    }

    const newItem = db.feedback.create({
      import_job_id: null,
      text,
      cleaned_text: localCleaning.cleaned,
      source: source as any,
      rating: rating || null,
      customer: customer || null,
      created_at: created_at || new Date().toISOString(),
      sentiment: analysis?.sentiment || null,
      sentiment_score: analysis?.sentiment_score ?? null,
      category: analysis?.category || null,
      topics: analysis?.topics || [],
      severity: analysis?.severity || null,
      summary: analysis?.summary || null,
      analyzed_at: analysis ? new Date().toISOString() : null,
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("POST /api/feedback error:", error);
    return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 });
  }
}
