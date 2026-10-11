import { CATEGORIES } from "@/types";

const LLM_PROVIDER = process.env.LLM_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : process.env.OPENAI_API_KEY ? "openai" : "gemini");
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || "";

export interface LLMAnalysisRow {
  id: string;
  sentiment: "positive" | "neutral" | "negative";
  sentiment_score: number; // -1 to 1
  category: string;
  topics: string[];
  severity: number; // 1 to 5
  summary: string;
}

export const llmClient = {
  isConfigured(): boolean {
    return Boolean(LLM_API_KEY && LLM_API_KEY !== "mock" && LLM_API_KEY.length > 5);
  },

  async analyzeFeedbackBatch(
    items: Array<{ id: string; text: string; rating?: number | null }>
  ): Promise<LLMAnalysisRow[] | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const prompt = `You are a customer feedback analysis expert. Analyze the following feedback records.
Allowed categories: ${CATEGORIES.join(", ")}.

For each item, classify:
- sentiment: "positive" | "neutral" | "negative"
- sentiment_score: float between -1.0 (most negative) to 1.0 (most positive)
- category: one of the allowed categories exactly
- topics: 1 to 3 short keyword tags (e.g. ["v2.4 update", "checkout crash"])
- severity: integer 1 (minor/positive) to 5 (critical bug, data loss, unusable)
- summary: concise 1-sentence summary of the user statement

Return ONLY a valid JSON array of objects with keys: id, sentiment, sentiment_score, category, topics, severity, summary.

Feedback Items:
${JSON.stringify(items, null, 2)}`;

    try {
      if (LLM_PROVIDER === "gemini") {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${LLM_API_KEY}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.1,
            },
          }),
        });

        if (!res.ok) {
          console.warn("Gemini API returned error:", res.status, await res.text());
          return null;
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;
        return JSON.parse(text) as LLMAnalysisRow[];
      } else if (LLM_PROVIDER === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LLM_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a feedback classifier. Respond ONLY with valid JSON." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
          }),
        });

        if (!res.ok) return null;
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : parsed.items || parsed.feedback || null;
      }
    } catch (err) {
      console.warn("LLM API error occurred:", err);
      return null;
    }

    return null;
  },

  async generateRecommendation(input: {
    category: string;
    metrics: {
      neg_count: number;
      category_total: number;
      avg_severity: number;
      trend_percent: number;
      freq: number;
      neg_share: number;
      severity: number;
      trend: number;
      priority: number;
    };
    quotes: string[];
  }): Promise<{
    title: string;
    recommendation: string;
    rationale: string;
    expected_impact: string;
    effort: "S" | "M" | "L";
    suggested_owner: string;
  } | null> {
    if (!this.isConfigured()) return null;

    const prompt = `You are a Chief Product Officer advising an engineering and CX leadership team.
Analyze the following category priority data:
- Category: ${input.category}
- Priority Score: ${Math.round(input.metrics.priority)} / 100
- Negative feedback count: ${input.metrics.neg_count} out of ${input.metrics.category_total} total feedback (${Math.round(input.metrics.neg_share * 100)}% negative)
- Average Severity: ${input.metrics.avg_severity.toFixed(1)} / 5.0
- Recent Trend: ${input.metrics.trend_percent > 0 ? "+" : ""}${Math.round(input.metrics.trend_percent)}% vs prior period
- Representative Customer Quotes:
${input.quotes.map((q, i) => `${i + 1}. "${q}"`).join("\n")}

STRICT RULE: Ground your recommendation ONLY in these numbers and quotes. Do NOT invent stats or external numbers.
Respond with ONLY a JSON object:
{
  "title": "Short action-oriented title",
  "recommendation": "Concrete tactical steps to solve the core root cause",
  "rationale": "Why this is critical now based directly on the ${Math.round(input.metrics.priority)} priority score and trend",
  "expected_impact": "Expected metric improvement (e.g., reduce negative feedback by X%, restore checkout completion)",
  "effort": "S" | "M" | "L",
  "suggested_owner": "Role e.g., Mobile Lead / CX Lead / Infrastructure Team"
}`;

    try {
      if (LLM_PROVIDER === "gemini") {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${LLM_API_KEY}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.2,
            },
          }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text ? JSON.parse(text) : null;
      }
    } catch (err) {
      console.warn("LLM recommendation generation error:", err);
    }
    return null;
  },
};
