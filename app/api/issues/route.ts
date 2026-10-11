import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const issueCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["open", "in_progress", "resolved"]).default("open"),
  priority_score: z.number().min(0).max(100).default(50),
  notes: z.string().max(3000).default(""),
  snapshot: z
    .object({
      category: z.string(),
      priority_score: z.number(),
      negative_count: z.number(),
      total_feedback: z.number(),
      avg_severity: z.number(),
      trend_percent: z.number(),
      top_quotes: z.array(z.string()),
    })
    .nullable()
    .optional(),
});

export async function GET() {
  try {
    const list = db.issues.list();
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: "Failed to list issues" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = issueCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const newIssue = db.issues.create({
      title: parsed.data.title,
      category: parsed.data.category,
      status: parsed.data.status,
      priority_score: parsed.data.priority_score,
      notes: parsed.data.notes,
      snapshot: parsed.data.snapshot || null,
    });

    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    console.error("POST /api/issues error:", error);
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }
}
