import { ChartSeries, DashboardKPIs, Feedback, FilterOptions } from "@/types";
import { calculateCategoryPriorities } from "@/lib/priority";

export async function aggregateDashboardData(
  feedbackList: Feedback[],
  options: FilterOptions = {}
): Promise<{ kpis: DashboardKPIs; charts: ChartSeries }> {
  const uniqueCount = feedbackList.length;
  const totalWeighted = feedbackList.reduce(
    (acc, curr) => acc + (curr.occurrence_count || 1),
    0
  );

  if (uniqueCount === 0) {
    return {
      kpis: {
        total_feedback: 0,
        unique_feedback: 0,
        positive_count: 0,
        neutral_count: 0,
        negative_count: 0,
        positive_pct: 0,
        neutral_pct: 0,
        negative_pct: 0,
        avg_rating: null,
        avg_sentiment: 0,
        top_issue_category: null,
        top_issue_priority: 0,
        week_over_week_change: 0,
        week_over_week_label: "No data",
        has_real_dates: false,
        has_ratings: false,
        has_sources: false,
      },
      charts: {
        sentiment_distribution: [
          { name: "Positive", value: 0, color: "#10b981" },
          { name: "Neutral", value: 0, color: "#f59e0b" },
          { name: "Negative", value: 0, color: "#f43f5e" },
        ],
        sentiment_over_time: [],
        volume_over_time: [],
        top_categories: [],
        top_complaints: [],
        source_breakdown: [],
      },
    };
  }

  let posCount = 0;
  let neuCount = 0;
  let negCount = 0;
  let totalRating = 0;
  let ratedCount = 0;
  let weightedSentimentSum = 0;
  let hasRatings = false;
  let hasSources = false;

  const now = new Date();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const thisPeriodStart = now.getTime() - fourteenDaysMs;
  const prevPeriodStart = now.getTime() - 2 * fourteenDaysMs;

  let thisPeriodNegCount = 0;
  let prevPeriodNegCount = 0;

  const datesMap: Record<
    string,
    { positive: number; neutral: number; negative: number; weightedScores: number[]; totalWeight: number }
  > = {};
  const categoriesMap: Record<string, { total: number; negative: number; positive: number }> = {};
  const topicsMap: Record<string, { count: number; category: string }> = {};
  const sourceMap: Record<string, number> = {};

  for (const f of feedbackList) {
    const weight = f.occurrence_count || 1;
    const isPos = f.sentiment === "positive" || (f.sentiment_score !== null && f.sentiment_score > 0.1);
    const isNeg = f.sentiment === "negative" || (f.sentiment_score !== null && f.sentiment_score < 0);

    if (isPos) posCount += weight;
    else if (isNeg) negCount += weight;
    else neuCount += weight;

    if (f.rating !== null && f.rating !== undefined) {
      hasRatings = true;
      totalRating += f.rating * weight;
      ratedCount += weight;
    }

    if (f.source && f.source !== "other") {
      hasSources = true;
      sourceMap[f.source] = (sourceMap[f.source] || 0) + weight;
    }

    const sScore = f.sentiment_score ?? 0;
    weightedSentimentSum += sScore * weight;

    const t = new Date(f.created_at).getTime();
    if (isNeg) {
      if (t >= thisPeriodStart) thisPeriodNegCount += weight;
      else if (t >= prevPeriodStart && t < thisPeriodStart) prevPeriodNegCount += weight;
    }

    // Timeline grouping by YYYY-MM-DD
    const dateKey = f.created_at.slice(0, 10);
    if (!datesMap[dateKey]) {
      datesMap[dateKey] = { positive: 0, neutral: 0, negative: 0, weightedScores: [], totalWeight: 0 };
    }
    const dObj = datesMap[dateKey];
    dObj.totalWeight += weight;
    if (isPos) dObj.positive += weight;
    else if (isNeg) dObj.negative += weight;
    else dObj.neutral += weight;
    dObj.weightedScores.push(sScore * weight);

    // Categories
    const cat = f.category || "Other";
    if (!categoriesMap[cat]) categoriesMap[cat] = { total: 0, negative: 0, positive: 0 };
    categoriesMap[cat].total += weight;
    if (isNeg) categoriesMap[cat].negative += weight;
    if (isPos) categoriesMap[cat].positive += weight;

    // Negative topics
    if (isNeg && f.topics && Array.isArray(f.topics)) {
      for (const topic of f.topics) {
        if (!topic) continue;
        const cleanTopic = topic.trim();
        if (!topicsMap[cleanTopic]) topicsMap[cleanTopic] = { count: 0, category: cat };
        topicsMap[cleanTopic].count += weight;
      }
    }
  }

  // Calculate Priorities
  const priorities = await calculateCategoryPriorities(feedbackList);
  const topPriority = priorities[0] || null;

  // Trend % capped display
  let wowChange = 0;
  let wowLabel = "Stable";
  if (prevPeriodNegCount > 0) {
    wowChange = Math.round(((thisPeriodNegCount - prevPeriodNegCount) / prevPeriodNegCount) * 100);
    if (wowChange > 500) wowLabel = ">500% vs prior";
    else if (wowChange > 0) wowLabel = `+${wowChange}% vs prior`;
    else wowLabel = `${wowChange}% vs prior`;
  } else if (thisPeriodNegCount > 0) {
    wowChange = 100;
    wowLabel = "New spike";
  }

  const kpis: DashboardKPIs = {
    total_feedback: totalWeighted,
    unique_feedback: uniqueCount,
    positive_count: posCount,
    neutral_count: neuCount,
    negative_count: negCount,
    positive_pct: Math.round((posCount / totalWeighted) * 100),
    neutral_pct: Math.round((neuCount / totalWeighted) * 100),
    negative_pct: Math.round((negCount / totalWeighted) * 100),
    avg_rating: hasRatings && ratedCount > 0 ? Math.round((totalRating / ratedCount) * 10) / 10 : null,
    avg_sentiment: Math.round((weightedSentimentSum / totalWeighted) * 100) / 100,
    top_issue_category: topPriority ? topPriority.category : null,
    top_issue_priority: topPriority ? topPriority.priority : 0,
    week_over_week_change: wowChange,
    week_over_week_label: wowLabel,
    has_real_dates: false,
    has_ratings: hasRatings,
    has_sources: hasSources,
  };

  const sentiment_distribution = [
    { name: "Positive", value: posCount, color: "#10b981" },
    { name: "Neutral", value: neuCount, color: "#f59e0b" },
    { name: "Negative", value: negCount, color: "#f43f5e" },
  ];

  const sortedDateKeys = Object.keys(datesMap).sort();
  const sentiment_over_time = sortedDateKeys.map((date) => {
    const d = datesMap[date];
    const avg = d.totalWeight > 0 ? d.weightedScores.reduce((a, b) => a + b, 0) / d.totalWeight : 0;
    return {
      date: date.slice(5),
      positive: d.positive,
      neutral: d.neutral,
      negative: d.negative,
      avg_score: Math.round(avg * 100) / 100,
    };
  });

  const volume_over_time = sortedDateKeys.map((date) => {
    const d = datesMap[date];
    return {
      date: date.slice(5),
      count: d.positive + d.neutral + d.negative,
    };
  });

  const top_categories = Object.entries(categoriesMap)
    .map(([name, data]) => ({
      name,
      total: data.total,
      negative: data.negative,
      positive: data.positive,
      percent_neg: data.total > 0 ? Math.round((data.negative / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const top_complaints = Object.entries(topicsMap)
    .map(([topic, data]) => ({
      topic,
      count: data.count,
      category: data.category,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const source_breakdown = Object.entries(sourceMap).map(([source, count]) => ({
    source: source.charAt(0).toUpperCase() + source.slice(1),
    count,
  }));

  return {
    kpis,
    charts: {
      sentiment_distribution,
      sentiment_over_time,
      volume_over_time,
      top_categories,
      top_complaints,
      source_breakdown,
    },
  };
}
