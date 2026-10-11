import { ChartSeries, DashboardKPIs, Feedback, FilterOptions } from "@/types";
import { calculateCategoryPriorities } from "@/lib/priority";

export async function aggregateDashboardData(
  feedbackList: Feedback[],
  options: FilterOptions = {}
): Promise<{ kpis: DashboardKPIs; charts: ChartSeries }> {
  const total = feedbackList.length;

  if (total === 0) {
    return {
      kpis: {
        total_feedback: 0,
        positive_count: 0,
        neutral_count: 0,
        negative_count: 0,
        positive_pct: 0,
        neutral_pct: 0,
        negative_pct: 0,
        avg_rating: 0,
        avg_sentiment: 0,
        top_issue_category: null,
        top_issue_priority: 0,
        week_over_week_change: 0,
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
  let totalSentimentScore = 0;

  const now = new Date();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeekStart = now.getTime() - sevenDaysMs;
  const prevWeekStart = now.getTime() - 2 * sevenDaysMs;

  let thisWeekCount = 0;
  let prevWeekCount = 0;

  const datesMap: Record<string, { positive: number; neutral: number; negative: number; scores: number[] }> = {};
  const categoriesMap: Record<string, { total: number; negative: number; positive: number }> = {};
  const topicsMap: Record<string, { count: number; category: string }> = {};
  const sourceMap: Record<string, number> = {};

  for (const f of feedbackList) {
    const isPos = f.sentiment === "positive" || (f.rating !== null && f.rating >= 4);
    const isNeg = f.sentiment === "negative" || (f.rating !== null && f.rating <= 2);

    if (isPos) posCount++;
    else if (isNeg) negCount++;
    else neuCount++;

    if (f.rating !== null && f.rating !== undefined) {
      totalRating += f.rating;
      ratedCount++;
    }

    if (f.sentiment_score !== null && f.sentiment_score !== undefined) {
      totalSentimentScore += f.sentiment_score;
    }

    const t = new Date(f.created_at).getTime();
    if (t >= thisWeekStart) thisWeekCount++;
    else if (t >= prevWeekStart && t < thisWeekStart) prevWeekCount++;

    // Timeline grouping (by week / date YYYY-MM-DD)
    const dateKey = f.created_at.slice(0, 10);
    if (!datesMap[dateKey]) {
      datesMap[dateKey] = { positive: 0, neutral: 0, negative: 0, scores: [] };
    }
    if (isPos) datesMap[dateKey].positive++;
    else if (isNeg) datesMap[dateKey].negative++;
    else datesMap[dateKey].neutral++;
    if (f.sentiment_score !== null) datesMap[dateKey].scores.push(f.sentiment_score);

    // Categories
    const cat = f.category || "Other";
    if (!categoriesMap[cat]) categoriesMap[cat] = { total: 0, negative: 0, positive: 0 };
    categoriesMap[cat].total++;
    if (isNeg) categoriesMap[cat].negative++;
    if (isPos) categoriesMap[cat].positive++;

    // Negative topics
    if (isNeg && f.topics && Array.isArray(f.topics)) {
      for (const topic of f.topics) {
        if (!topic) continue;
        const cleanTopic = topic.trim();
        if (!topicsMap[cleanTopic]) topicsMap[cleanTopic] = { count: 0, category: cat };
        topicsMap[cleanTopic].count++;
      }
    }

    // Source
    const src = f.source || "other";
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  }

  // Calculate Priorities to get top issue
  const priorities = await calculateCategoryPriorities(feedbackList);
  const topPriority = priorities[0] || null;

  const wowChange =
    prevWeekCount > 0
      ? Math.round(((thisWeekCount - prevWeekCount) / prevWeekCount) * 100)
      : thisWeekCount > 0
      ? 100
      : 0;

  const kpis: DashboardKPIs = {
    total_feedback: total,
    positive_count: posCount,
    neutral_count: neuCount,
    negative_count: negCount,
    positive_pct: Math.round((posCount / total) * 100),
    neutral_pct: Math.round((neuCount / total) * 100),
    negative_pct: Math.round((negCount / total) * 100),
    avg_rating: ratedCount > 0 ? Math.round((totalRating / ratedCount) * 10) / 10 : 0,
    avg_sentiment: Math.round((totalSentimentScore / total) * 100) / 100,
    top_issue_category: topPriority ? topPriority.category : null,
    top_issue_priority: topPriority ? topPriority.priority : 0,
    week_over_week_change: wowChange,
  };

  // Build chart structures
  const sentiment_distribution = [
    { name: "Positive", value: posCount, color: "#10b981" },
    { name: "Neutral", value: neuCount, color: "#f59e0b" },
    { name: "Negative", value: negCount, color: "#f43f5e" },
  ];

  // Timeline sorted by date asc
  const sortedDateKeys = Object.keys(datesMap).sort();
  const sentiment_over_time = sortedDateKeys.map((date) => {
    const d = datesMap[date];
    const avg = d.scores.length > 0 ? d.scores.reduce((a, b) => a + b, 0) / d.scores.length : 0;
    return {
      date: date.slice(5), // MM-DD
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
    .sort((a, b) => b.negative - a.negative);

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
