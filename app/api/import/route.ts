import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adaptionService } from "@/lib/adaption";
import { analyzeFeedbackRows } from "@/lib/analyze";

const importSchema = z.object({
  filename: z.string().default("imported_feedback.csv"),
  rows: z.array(z.record(z.any())).min(1, "At least 1 row is required").max(2000, "Maximum 2000 rows allowed"),
  mapping: z.object({
    textField: z.string().min(1, "Text column mapping is required"),
    dateField: z.string().optional().default(""),
    ratingField: z.string().optional().default(""),
    sourceField: z.string().optional().default(""),
    customerField: z.string().optional().default(""),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = importSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { filename, rows, mapping } = parsed.data;

    // 1. Create initial import job
    const job = db.importJobs.create({
      filename,
      row_count: rows.length,
      adaption_dataset_id: null,
      adaption_status: "running",
      quality_score: null,
      quality_report: null,
    });

    // 2. Map and insert raw feedback items
    const feedbackToInsert = rows
      .map((row) => {
        const rawText = String(row[mapping.textField] || "").trim();
        if (!rawText) return null;

        let dateStr = new Date().toISOString();
        if (mapping.dateField && row[mapping.dateField]) {
          const d = new Date(row[mapping.dateField]);
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString();
          }
        }

        let rating: number | null = null;
        if (mapping.ratingField && row[mapping.ratingField] !== undefined) {
          const r = parseInt(row[mapping.ratingField], 10);
          if (!isNaN(r) && r >= 1 && r <= 5) rating = r;
        }

        let source: any = "review";
        if (mapping.sourceField && row[mapping.sourceField]) {
          const s = String(row[mapping.sourceField]).toLowerCase();
          if (["review", "survey", "support", "social"].includes(s)) {
            source = s;
          }
        }

        const customer = mapping.customerField && row[mapping.customerField]
          ? String(row[mapping.customerField]).slice(0, 150)
          : null;

        return {
          import_job_id: job.id,
          text: rawText,
          cleaned_text: null,
          source,
          rating,
          customer,
          created_at: dateStr,
          sentiment: null,
          sentiment_score: null,
          category: null,
          topics: [],
          severity: null,
          summary: null,
          analyzed_at: null,
        };
      })
      .filter(Boolean) as Array<Parameters<typeof db.feedback.create>[0]>;

    const createdFeedback = db.feedback.createMany(feedbackToInsert);

    // 3. Process through Adaption Adaptive Data pipeline
    const adaptionResult = await adaptionService.processFeedbackDataset(
      createdFeedback.map((f) => ({ id: f.id, text: f.text })),
      { filename, isSampleData: false }
    );

    // Update feedback records with cleaned_text
    for (const cleanedRow of adaptionResult.cleanedRows) {
      db.feedback.updateCleanedText(cleanedRow.id, cleanedRow.cleaned_text);
    }

    // Update job with Adaption quality metrics
    const updatedJob = db.importJobs.update(job.id, {
      adaption_dataset_id: adaptionResult.datasetId,
      adaption_status: adaptionResult.status,
      quality_score: adaptionResult.qualityScore,
      quality_report: adaptionResult.qualityReport,
    });

    // 4. Run AI Analysis pipeline on the cleaned items
    const itemsToAnalyze = db.feedback.getUnanalyzed(2000, job.id);
    await analyzeFeedbackRows(itemsToAnalyze);

    return NextResponse.json({
      success: true,
      job: updatedJob,
      importedCount: createdFeedback.length,
      qualityScore: adaptionResult.qualityScore,
      adaptionStatus: adaptionResult.status,
    });
  } catch (error) {
    console.error("POST /api/import error:", error);
    return NextResponse.json({ error: "Failed to import feedback" }, { status: 500 });
  }
}
