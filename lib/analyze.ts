import crypto from "crypto";
import { db } from "@/lib/db";
import { llmClient } from "@/lib/llm";
import { analyzeFeedbackRuleBased } from "@/lib/fallback";
import { CategoryType, Feedback } from "@/types";

const memoryCache = new Map<string, any>();

function hashText(text: string): string {
  return crypto.createHash("sha256").update(text.trim()).digest("hex");
}

export async function analyzeFeedbackRows(
  items: Feedback[],
  onProgress?: (processed: number, total: number) => void
): Promise<number> {
  if (!items.length) return 0;

  const BATCH_SIZE = 15;
  let totalProcessed = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const updates: Array<{
      id: string;
      sentiment: Feedback["sentiment"];
      sentiment_score: number;
      category: Feedback["category"];
      topics: string[];
      severity: number;
      summary: string;
    }> = [];

    // Check cache first
    const uncached: Array<{ id: string; text: string; rating: number | null; category: CategoryType | null }> = [];

    for (const item of chunk) {
      const textToAnalyze = item.cleaned_text || item.text;
      const hash = hashText(textToAnalyze);

      if (memoryCache.has(hash)) {
        const cached = memoryCache.get(hash);
        updates.push({ id: item.id, ...cached });
      } else {
        uncached.push({ id: item.id, text: textToAnalyze, rating: item.rating, category: item.category });
      }
    }

    // Try LLM for uncached items if available
    let llmResults: any[] | null = null;
    if (uncached.length > 0 && llmClient.isConfigured()) {
      llmResults = await llmClient.analyzeFeedbackBatch(uncached);
    }

    for (const item of uncached) {
      const textToAnalyze = item.text;
      const hash = hashText(textToAnalyze);
      const llmItem = llmResults?.find((r) => r.id === item.id);

      if (llmItem && llmItem.sentiment && llmItem.category) {
        const parsed = {
          sentiment: llmItem.sentiment,
          sentiment_score: Number(llmItem.sentiment_score) || 0,
          category: llmItem.category as CategoryType,
          topics: Array.isArray(llmItem.topics) ? llmItem.topics.slice(0, 3) : [],
          severity: Math.min(5, Math.max(1, Number(llmItem.severity) || 1)),
          summary: String(llmItem.summary || ""),
        };
        memoryCache.set(hash, parsed);
        updates.push({ id: item.id, ...parsed });
      } else {
        // Fallback rule-based
        const ruleRes = analyzeFeedbackRuleBased(textToAnalyze, item.category, item.rating);
        memoryCache.set(hash, ruleRes);
        updates.push({ id: item.id, ...ruleRes });
      }
    }

    if (updates.length > 0) {
      db.feedback.batchUpdateAnalysis(updates);
    }

    totalProcessed += chunk.length;
    if (onProgress) {
      onProgress(totalProcessed, items.length);
    }
  }

  return totalProcessed;
}
