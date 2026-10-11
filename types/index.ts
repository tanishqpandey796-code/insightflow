export type SentimentType = "positive" | "neutral" | "negative";
export type SourceType = "review" | "survey" | "support" | "social" | "other";
export type IssueStatus = "open" | "in_progress" | "resolved";
export type AdaptionStatus = "pending" | "running" | "done" | "failed" | "skipped";
export type PriorityLevel = "Critical" | "High" | "Medium";

export const CATEGORIES = [
  "App/Website Bugs",
  "Product Quality",
  "Usability/UX",
  "Delivery & Shipping",
  "Pricing & Billing",
  "Customer Support",
  "Other",
] as const;

export type CategoryType = typeof CATEGORIES[number];

export interface ImportJob {
  id: string;
  filename: string;
  row_count: number;
  adaption_dataset_id: string | null;
  adaption_status: AdaptionStatus;
  quality_score: number | null;
  quality_report: {
    clean_rate?: number;
    rows_cleaned?: number;
    rows_dropped?: number;
    noise_reduced_percent?: number;
    duplicates_removed?: number;
    pii_masked?: number;
    summary?: string;
  } | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  import_job_id: string | null;
  text: string;
  cleaned_text: string | null;
  source: SourceType;
  rating: number | null;
  customer: string | null;
  created_at: string;
  sentiment: SentimentType | null;
  sentiment_score: number | null; // -1 to 1
  category: CategoryType | null;
  topics: string[];
  severity: number | null; // 1 to 5
  summary: string | null;
  analyzed_at: string | null;
}

export interface IssueSnapshot {
  category: string;
  priority_score: number;
  negative_count: number;
  total_feedback: number;
  avg_severity: number;
  trend_percent: number;
  top_quotes: string[];
}

export interface Issue {
  id: string;
  title: string;
  category: string;
  status: IssueStatus;
  priority_score: number;
  notes: string;
  snapshot: IssueSnapshot | null;
  created_at: string;
  updated_at: string;
}

export interface ReportSnapshot {
  title: string;
  generated_at: string;
  date_range?: { from?: string; to?: string };
  kpis: DashboardKPIs;
  top_issues: PriorityItem[];
  tracked_issues: Issue[];
  category_breakdown: Array<{ name: string; count: number; negative_count: number; positive_count: number; avg_rating: number }>;
  executive_summary: string;
}

export interface Report {
  id: string;
  share_token: string;
  title: string;
  payload: ReportSnapshot;
  created_at: string;
}

export interface PriorityComponents {
  freq: number;       // neg_count / max_neg_count (0-1)
  neg_share: number;  // neg_count / total (0-1)
  severity: number;   // avg_severity / 5 (0-1)
  trend: number;      // clamp((neg_now - neg_prev) / max(neg_prev, 1), 0, 1)
}

export interface AIRecommendation {
  title: string;
  recommendation: string;
  rationale: string;
  expected_impact: string;
  effort: "S" | "M" | "L";
  suggested_owner: string;
}

export interface PriorityItem {
  category: string;
  priority: number;
  level: PriorityLevel;
  components: PriorityComponents;
  metrics: {
    neg_count: number;
    max_neg_count: number;
    category_total: number;
    avg_severity: number;
    neg_this_period: number;
    neg_prev_period: number;
    trend_percent: number;
  };
  quotes: string[];
  recommendation: AIRecommendation;
}

export interface DashboardKPIs {
  total_feedback: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  positive_pct: number;
  neutral_pct: number;
  negative_pct: number;
  avg_rating: number;
  avg_sentiment: number;
  top_issue_category: string | null;
  top_issue_priority: number;
  week_over_week_change: number; // percentage change in volume or negative volume
}

export interface ChartSeries {
  sentiment_distribution: Array<{ name: string; value: number; color: string }>;
  sentiment_over_time: Array<{ date: string; positive: number; neutral: number; negative: number; avg_score: number }>;
  volume_over_time: Array<{ date: string; count: number }>;
  top_categories: Array<{ name: string; total: number; negative: number; positive: number; percent_neg: number }>;
  top_complaints: Array<{ topic: string; count: number; category: string }>;
  source_breakdown: Array<{ source: string; count: number }>;
}

export interface FilterOptions {
  q?: string;
  source?: string;
  sentiment?: string;
  category?: string;
  rating?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
