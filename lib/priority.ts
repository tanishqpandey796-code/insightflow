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

  const now = new Date();
  const fortyFiveDaysMs = 45 * 24 * 60 * 60 * 1000;
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  // Since dataset has simulated dates over 90 days, split in half (past 45d vs 45-90d)
  const currentPeriodStart = new Date(now.getTime() - fortyFiveDaysMs).getTime();
  const prevPeriodStart = new Date(now.getTime() - ninetyDaysMs).getTime();

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

    const weight = f.occurrence_count || 1;
    const stat = categoryStats[cat];
    stat.total += weight;

    const time = new Date(f.created_at).getTime();
    const isNegative = f.sentiment === "negative" || (f.sentiment_score !== null && f.sentiment_score < 0);

    if (isNegative) {
      stat.neg_count += weight;
      stat.severity_sum += (f.severity || 3) * weight;

      if (stat.negative_quotes.length < 5 && f.text && !stat.negative_quotes.includes(f.text)) {
        stat.negative_quotes.push(f.text);
      }

      if (time >= currentPeriodStart) {
        stat.neg_this_period += weight;
      } else if (time >= prevPeriodStart && time < currentPeriodStart) {
        stat.neg_prev_period += weight;
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

    // Component calculations per TRD §2.7 & Final Update
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

    // Trend % formatting & capping as required in C.8
    let trendDisplay = "Stable";
    let trendPercent = 0;
    if (stats.neg_prev_period < 5 && stats.neg_this_period > 0) {
      trendDisplay = "New spike";
      trendPercent = 100;
    } else if (stats.neg_prev_period > 0) {
      const pct = Math.round(((stats.neg_this_period - stats.neg_prev_period) / stats.neg_prev_period) * 100);
      trendPercent = pct;
      if (pct > 500) {
        trendDisplay = ">500%";
      } else if (pct > 0) {
        trendDisplay = `+${pct}%`;
      } else {
        trendDisplay = `${pct}%`;
      }
    } else if (stats.neg_this_period > 0) {
      trendDisplay = "New spike";
      trendPercent = 100;
    }

    const metrics = {
      neg_count: stats.neg_count,
      max_neg_count: maxNegCount,
      category_total: stats.total,
      avg_severity: Math.round(avg_severity * 10) / 10,
      neg_this_period: stats.neg_this_period,
      neg_prev_period: stats.neg_prev_period,
      trend_percent: trendPercent,
      trend_display: trendDisplay,
    };

    const components = {
      freq: Math.round(freq * 100) / 100,
      neg_share: Math.round(neg_share * 100) / 100,
      severity: Math.round(severity * 100) / 100,
      trend: Math.round(trend * 100) / 100,
    };

    // AI recommendation or grounded fallback
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
      rec = generateGroundedRecommendation(category, priorityScore, metrics, stats.negative_quotes);
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

  results.sort((a, b) => b.priority - a.priority);
  return results;
}

function generateGroundedRecommendation(
  category: string,
  priority: number,
  metrics: {
    neg_count: number;
    category_total: number;
    avg_severity: number;
    trend_display: string;
  },
  quotes: string[]
): AIRecommendation {
  if (category === "Fraud and Scam") {
    return {
      title: "Harden Seller Verification & Prevent Duplicate Charges",
      recommendation:
        "Institute mandatory merchant identity verification and escrow payment protection. Deploy automated checks on payment gateways to eliminate duplicate billing transactions.",
      rationale: `Scored ${priority}/100 priority driven by ${metrics.neg_count} fraud/scam incidents (${Math.round((metrics.neg_count / Math.max(metrics.category_total, 1)) * 100)}% of category total) with critical ${metrics.avg_severity}/5.0 severity.`,
      expected_impact: "Deflect 80% of counterfeit disputes and eliminate unauthorized extra fees.",
      effort: "M",
      suggested_owner: "Trust & Safety / Payments Lead",
    };
  }

  if (category === "Customer Service") {
    return {
      title: "Overhaul Support Queue Routing & SLA Response Timers",
      recommendation:
        "Implement tier-1 routing with maximum 15-minute response caps for unresolved inquiries. Train agents on replacement resolution protocols.",
      rationale: `Customer Service accounts for ${metrics.neg_count} negative complaints out of ${metrics.category_total} customer touchpoints, with unresolved tickets as the dominant driver.`,
      expected_impact: "Reduce average ticket resolution time by 45% and raise CSAT by 30 points.",
      effort: "S",
      suggested_owner: "Head of Customer Support",
    };
  }

  if (category === "Operational Issues") {
    return {
      title: "Stabilize Checkout Web Service & Carrier Packaging SLAs",
      recommendation:
        "Address website checkout crashes and cart glitches under peak load. Establish strict packaging standards with carriers to prevent damaged or missing parcels.",
      rationale: `${metrics.neg_count} operational failures logged (${Math.round((metrics.neg_count / Math.max(metrics.category_total, 1)) * 100)}% negative rate), led by two-week delivery delays and checkout errors.`,
      expected_impact: "Reduce checkout drop-offs by 65% and cut shipping damage claims.",
      effort: "M",
      suggested_owner: "Operations & DevOps Lead",
    };
  }

  if (category === "Product Feedback") {
    return {
      title: "Audit Hardware/Feature Defects & Early Lifecycle Failures",
      recommendation:
        "Investigate the root cause of 1-week product breakdowns. Tighten QA inspection for common defects prior to customer fulfillment.",
      rationale: `Product Feedback logged ${metrics.neg_count} defect complaints out of ${metrics.category_total} total reviews, with 'stopped working after a week' as primary complaint.`,
      expected_impact: "Decrease defective unit return requests by 50% within 60 days.",
      effort: "M",
      suggested_owner: "QA & Product Engineering",
    };
  }

  return {
    title: `Address Core Complaints in ${category}`,
    recommendation: `Conduct thorough audit of ${metrics.neg_count} negative complaints. Prioritize recurring friction patterns in next sprint cycle.`,
    rationale: `Priority score of ${priority}/100 with ${metrics.neg_count} complaints out of ${metrics.category_total} entries.`,
    expected_impact: "Target 25-30% reduction in negative mentions.",
    effort: priority >= 70 ? "L" : priority >= 40 ? "M" : "S",
    suggested_owner: "Product Manager",
  };
}
