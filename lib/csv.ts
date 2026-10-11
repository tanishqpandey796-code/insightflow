import Papa from "papaparse";
import { Feedback } from "@/types";

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  error?: string;
}

export function parseCSVString(csvContent: string): CSVParseResult {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: true,
  });

  if (result.errors && result.errors.length > 0 && result.data.length === 0) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      error: result.errors[0].message,
    };
  }

  const headers = result.meta.fields || [];
  const rows = (result.data as Record<string, any>[]).slice(0, 10000); // 10,000 row safety limit

  return {
    headers,
    rows,
    totalRows: rows.length,
  };
}

export function autoDetectColumnMapping(headers: string[]): {
  textField: string;
  categoryField: string;
  dateField: string;
  ratingField: string;
  sourceField: string;
  customerField: string;
} {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  const findHeader = (candidates: string[]): string => {
    for (const c of candidates) {
      const idx = lowerHeaders.findIndex((h) => h === c || h.includes(c));
      if (idx !== -1) return headers[idx];
    }
    return "";
  };

  return {
    textField: findHeader(["review", "text", "feedback", "comment", "message", "content", "body"]) || headers[0] || "",
    categoryField: findHeader(["category", "theme", "topic", "tag", "type"]) || "",
    dateField: findHeader(["date", "created_at", "timestamp", "time", "created"]) || "",
    ratingField: findHeader(["rating", "score", "stars", "star"]) || "",
    sourceField: findHeader(["source", "channel", "platform", "origin"]) || "",
    customerField: findHeader(["customer", "name", "user", "client", "author", "email"]) || "",
  };
}

export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return "-";
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return str;
}

export function exportFeedbackToCSV(items: Feedback[]): string {
  const data = items.map((f) => ({
    Review: sanitizeCsvCell(f.text),
    Category: f.category || "-",
    Occurrences: f.occurrence_count || 1,
    Sentiment: f.sentiment || "-",
    SentimentScore: f.sentiment_score ?? "-",
    Severity: f.severity ?? "-",
    Topics: f.topics.join("; ") || "-",
    Rating: f.rating ? `${f.rating} ★` : "-",
    Source: f.source || "-",
    Customer: f.customer || "-",
    Date: f.created_at || "-",
  }));

  return Papa.unparse(data);
}
