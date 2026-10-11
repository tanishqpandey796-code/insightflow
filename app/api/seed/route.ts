import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const csvPath = path.join(process.cwd(), "data", "sample-feedback.csv");
    const cachePath = path.join(process.cwd(), "data", "precomputed-adaption.json");

    if (!fs.existsSync(csvPath) || !fs.existsSync(cachePath)) {
      return NextResponse.json({ error: "Sample data files missing" }, { status: 500 });
    }

    const csvRaw = fs.readFileSync(csvPath, "utf-8");
    const cacheData = JSON.parse(fs.readFileSync(cachePath, "utf-8"));

    const parsedCsv = Papa.parse(csvRaw, { header: true, dynamicTyping: true });
    const rows = parsedCsv.data as any[];

    // Reset previous demo data
    db.feedback.deleteAll();

    // Create Adaption import job
    const job = db.importJobs.create({
      filename: "sample-feedback.csv",
      row_count: rows.length,
      adaption_dataset_id: cacheData.adaption_dataset_id || "ds_adaption_prod_sample_90d",
      adaption_status: "done",
      quality_score: cacheData.quality_score || 94.8,
      quality_report: cacheData.quality_report || null,
    });

    const itemsToInsert = rows.map((r, i) => {
      const rec = cacheData.records?.[i] || {};
      return {
        import_job_id: job.id,
        text: r.text || "",
        cleaned_text: r.text || "",
        source: r.source || "review",
        rating: r.rating || null,
        customer: r.customer || null,
        created_at: r.date || new Date().toISOString(),
        sentiment: rec.sentiment || "neutral",
        sentiment_score: rec.sentiment_score ?? 0,
        category: rec.category || "Other",
        topics: rec.topics || [],
        severity: rec.severity || 1,
        summary: rec.summary || "",
        analyzed_at: new Date().toISOString(),
      };
    });

    db.feedback.createMany(itemsToInsert);

    // Also seed a default tracked issue for the rising bug if none exists
    const existingIssues = db.issues.list();
    if (existingIssues.length === 0) {
      db.issues.create({
        title: "Checkout & App Launch Crash on v2.4 Release",
        category: "App/Website Bugs",
        status: "in_progress",
        priority_score: 91,
        notes: "Assigned to Mobile platform team. Hotfix build 2.4.1 undergoing regression testing.",
        snapshot: {
          category: "App/Website Bugs",
          priority_score: 91,
          negative_count: 35,
          total_feedback: 55,
          avg_severity: 4.6,
          trend_percent: 180,
          top_quotes: [
            "The app keeps crashing immediately after opening on iOS since the v2.4 update. Cannot access my cart!",
            "Latest update completely broke checkout. It freezes on payment screen and restarts the app.",
            "Cannot complete my transaction. App crashes during Apple Pay authorization.",
          ],
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: itemsToInsert.length,
      jobId: job.id,
      qualityScore: job.quality_score,
      message: "Sample dataset successfully loaded with pre-computed Adaption quality gate.",
    });
  } catch (error) {
    console.error("POST /api/seed error:", error);
    return NextResponse.json({ error: "Failed to seed sample data" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    db.feedback.deleteAll();
    return NextResponse.json({ success: true, message: "Feedback database cleared" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear database" }, { status: 500 });
  }
}
