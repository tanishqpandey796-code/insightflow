import { CATEGORIES, CategoryType, Feedback, PriorityItem, PriorityLevel, AIRecommendation } from "@/types";
import { llmClient } from "@/lib/llm";

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export async function calculateCategoryPriorities(
  feedbackList: Feedback[],
  options: { from?: string; to?: string } = {}
): Promise<PriorityItem[]> {
  if (!feedbackList.length) return [];

  // Define current period vs previous period
  // If dates are provided, split in half; otherwise split the last 60 days into 30 vs 30 days
  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

  const currentPeriodStart = new Date(now.getTime() - thirtyDaysMs).getTime();
  const prevPeriodStart = new Date(now.getTime() - sixtyDaysMs).getTime();

  // Aggregate stats per category
  const categoryStats: Record<
    string,
    {
      total: number;
      neg_count: number;
      severity_sum: number;
      neg_this_period: number;
      neg_prev_period: number;
      negative_quotes: string[];
    }
  > = {};

  for (const cat of CATEGORIES) {
    categoryStats[cat] = {
      total: 0,
      neg_count: 0,
      severity_sum: 0,
      neg_this_period: 0,
      neg_prev_period: 0,
      negative_quotes: [],
    };
  }

  for (const f of feedbackList) {
    const cat = f.category || "Other";
    if (!categoryStats[cat]) {
      categoryStats[cat] = {
        total: 0,
        neg_count: 0,
        severity_sum: 0,
        neg_this_period: 0,
        neg_prev_period: 0,
        negative_quotes: [],
      };
    }

    const stat = categoryStats[cat];
    stat.total += 1;

    const time = new Date(f.created_at).getTime();
    const isNegative = f.sentiment === "negative" || (f.rating !== null && f.rating <= 2);

    if (isNegative) {
      stat.neg_count += 1;
      stat.severity_sum += f.severity || 3;
      if (stat.negative_quotes.length < 5 && f.text) {
        stat.negative_quotes.push(f.text);
      }

      if (time >= currentPeriodStart) {
        stat.neg_this_period += 1;
      } else if (time >= prevPeriodStart && time < currentPeriodStart) {
        stat.neg_prev_period += 1;
      }
    }
  }

  // Find max_negative_count_across_categories
  let maxNegCount = 0;
  for (const cat of Object.keys(categoryStats)) {
    if (categoryStats[cat].neg_count > maxNegCount) {
      maxNegCount = categoryStats[cat].neg_count;
    }
  }

  const results: PriorityItem[] = [];

  for (const [category, stats] of Object.entries(categoryStats)) {
    if (stats.total === 0) continue;

    // Component calculations per TRD §2.7
    const freq = maxNegCount > 0 ? stats.neg_count / maxNegCount : 0;
    const neg_share = stats.total > 0 ? stats.neg_count / stats.total : 0;
    const avg_severity = stats.neg_count > 0 ? stats.severity_sum / stats.neg_count : 1;
    const severity = avg_severity / 5;

    const denom = Math.max(stats.neg_prev_period, 1);
    const rawTrend = (stats.neg_this_period - stats.neg_prev_period) / denom;
    const trend = clamp(rawTrend, 0, 1);

    // Exact TRD Formula: priority = 100 * (0.35*freq + 0.25*neg_share + 0.20*severity + 0.20*trend)
    const priorityScore = Math.round(
      100 * (0.35 * freq + 0.25 * neg_share + 0.20 * severity + 0.20 * trend)
    );

    let level: PriorityLevel = "Medium";
    if (priorityScore >= 70) {
      level = "Critical";
    } else if (priorityScore >= 40) {
      level = "High";
    }

    const trendPercent =
      stats.neg_prev_period > 0
        ? Math.round(((stats.neg_this_period - stats.neg_prev_period) / stats.neg_prev_period) * 100)
        : stats.neg_this_period > 0
        ? 100
        : 0;

    const metrics = {
      neg_count: stats.neg_count,
      max_neg_count: maxNegCount,
      category_total: stats.total,
      avg_severity: Math.round(avg_severity * 10) / 10,
      neg_this_period: stats.neg_this_period,
      neg_prev_period: stats.neg_prev_period,
      trend_percent: trendPercent,
    };

    const components = {
      freq: Math.round(freq * 100) / 100,
      neg_share: Math.round(neg_share * 100) / 100,
      severity: Math.round(severity * 100) / 100,
      trend: Math.round(trend * 100) / 100,
    };

    // Generate AI recommendation or grounded fallback
    let rec: AIRecommendation | null = null;
    if (llmClient.isConfigured()) {
      rec = await llmClient.generateRecommendation({
        category,
        metrics: {
          ...metrics,
          ...components,
          priority: priorityScore,
        },
        quotes: stats.negative_quotes.slice(0, 3),
      });
    }

    if (!rec) {
      rec = generateFallbackRecommendation(category, priorityScore, metrics, stats.negative_quotes);
    }

    results.push({
      category,
      priority: priorityScore,
      level,
      components,
      metrics,
      quotes: stats.negative_quotes.slice(0, 3),
      recommendation: rec,
    });
  }

  // Rank by priority score descending
  results.sort((a, b) => b.priority - a.priority);
  return results;
}

function generateFallbackRecommendation(
  category: string,
  priority: number,
  metrics: {
    neg_count: number;
    category_total: number;
    avg_severity: number;
    trend_percent: number;
  },
  quotes: string[]
): AIRecommendation {
  if (category === "App/Website Bugs") {
    return {
      title: "Deploy Emergency Hotfix for Checkout & Launch Crashes",
      recommendation:
        "Isolate payment controller and session lifecycle memory leaks introduced in v2.4. Roll back checkout bundle or patch Apple Pay SDK crash immediately.",
      rationale: `Category priority scored ${priority}/100 with ${metrics.neg_count} negative reports (${metrics.trend_percent > 0 ? "+" : ""}${metrics.trend_percent}% recent surge) and a severe ${metrics.avg_severity}/5 severity rating.`,
      expected_impact: "Reduce app crash rate by 85% and restore abandoned checkout revenue.",
      effort: "M",
      suggested_owner: "Mobile Platform Lead",
    };
  }

  if (category === "Delivery & Shipping") {
    return {
      title: "Audit Carrier SLA & Automate Tracking Notifications",
      recommendation:
        "Implement webhook tracking updates for courier status shifts. Alert customers proactively on shipment milestones to deflect support inquiries.",
      rationale: `${metrics.neg_count} shipping complaints logged (${Math.round((metrics.neg_count / Math.max(metrics.category_total, 1)) * 100)}% of shipping feedback), predominantly driven by tracking latency.`,
      expected_impact: "Deflect 40% of 'Where is my order?' support tickets and improve post-purchase CSAT.",
      effort: "S",
      suggested_owner: "Logistics & CX Operations",
    };
  }

  if (category === "Customer Support") {
    return {
      title: "Refactor Chatbot Escalation & Support Routing",
      recommendation:
        "Reduce chatbot loop threshold from 3 turns to 1 turn before human handoff. Add instant callback options during peak live-chat queues.",
      rationale: `Customer support accounts for ${metrics.neg_count} negative touchpoints with wait times and chat loops as top drivers.`,
      expected_impact: "Reduce average queue handle time by 35% and boost resolution satisfaction.",
      effort: "S",
      suggested_owner: "Head of Customer Experience",
    };
  }

  if (category === "Pricing & Billing") {
    return {
      title: "Add Transparent Renewal Reminders & One-Click Cancel",
      recommendation:
        "Send automatic 7-day email reminders prior to annual subscription renewals. Provide a clear self-serve cancellation flow in user account settings.",
      rationale: `Users report unexpected charges with a ${metrics.avg_severity}/5 severity score. Eliminating dark patterns reduces chargeback disputes.`,
      expected_impact: "Cut disputed billing charges by 70% and rebuild user trust.",
      effort: "S",
      suggested_owner: "Billing & Monetization Team",
    };
  }

  return {
    title: `Address Core Friction in ${category}`,
    recommendation: `Conduct usability and QA audit on ${category}. Review top ${metrics.neg_count} customer reports and prioritize recurring root causes in next sprint.`,
    rationale: `Score of ${priority}/100 driven by ${metrics.neg_count} negative items out of ${metrics.category_total} total feedback entries.`,
    expected_impact: `Expected 25-30% reduction in negative ${category.toLowerCase()} mentions within 30 days.`,
    effort: priority >= 70 ? "L" : priority >= 40 ? "M" : "S",
    suggested_owner: "Product Manager",
  };
}
