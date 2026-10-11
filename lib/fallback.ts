import { CategoryType, Feedback, SentimentType } from "@/types";

interface RuleAnalysisResult {
  sentiment: SentimentType;
  sentiment_score: number;
  category: CategoryType;
  topics: string[];
  severity: number;
  summary: string;
}

const CATEGORY_KEYWORDS: Record<CategoryType, string[]> = {
  "App/Website Bugs": [
    "crash", "crashes", "crashing", "freeze", "freezes", "bug", "bugs", "glitch",
    "error", "500", "hangs", "force close", "black screen", "v2.4", "update",
    "hotfix", "regression", "quit", "restarts", "apple pay", "bluetooth"
  ],
  "Product Quality": [
    "quality", "finish", "aluminum", "durability", "fraying", "cheap", "plasticky",
    "battery", "sound", "noise cancellation", "headphones", "resolution", "display",
    "screen", "hinge", "material", "materials", "build"
  ],
  "Delivery & Shipping": [
    "delivery", "shipping", "courier", "package", "parcel", "box", "tracking",
    "delayed", "arrived", "customs", "carrier", "porch", "driveway"
  ],
  "Customer Support": [
    "support", "agent", "representative", "maya", "chat", "chatbot", "ticket",
    "phone", "help desk", "refund", "warranty", "disconnected", "service"
  ],
  "Pricing & Billing": [
    "price", "pricing", "billing", "renewal", "auto-renewal", "subscription",
    "invoice", "vat", "charge", "charged", "expensive", "cancel", "cancellation", "roi"
  ],
  "Usability/UX": [
    "navigation", "menu", "filter", "filters", "ux", "ui", "interface", "export",
    "dark mode", "font", "cognitive", "intuitive", "confusing"
  ],
  "Other": [],
};

const POSITIVE_WORDS = [
  "exceptional", "outstanding", "excellent", "super", "great", "love", "loved",
  "amazing", "best", "fast", "smooth", "helpful", "proactive", "patient", "intuitive",
  "fair", "transparent", "top-tier", "impressed", "solid", "vivid", "sharp"
];

const NEGATIVE_WORDS = [
  "crash", "crashes", "crashing", "freeze", "freezes", "broken", "unusable",
  "disaster", "horrible", "terrible", "worst", "hate", "delayed", "disconnect",
  "disconnected", "frustrating", "cheat", "cheap", "poor", "dark pattern",
  "invalid", "error", "crushed", "surprise", "force close"
];

export function analyzeFeedbackRuleBased(text: string, rating?: number | null): RuleAnalysisResult {
  const lower = text.toLowerCase();

  // 1. Determine Category
  let matchedCategory: CategoryType = "Other";
  let maxCatMatches = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [CategoryType, string[]][]) {
    let count = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) count++;
    }
    if (count > maxCatMatches) {
      maxCatMatches = count;
      matchedCategory = cat;
    }
  }

  // 2. Extract Topics / Keywords
  const foundKeywords: string[] = [];
  const words = lower.split(/[^a-zA-Z0-9_\-.]+/);
  for (const kw of CATEGORY_KEYWORDS[matchedCategory]) {
    if (lower.includes(kw) && !foundKeywords.includes(kw)) {
      foundKeywords.push(kw);
      if (foundKeywords.length >= 3) break;
    }
  }
  if (foundKeywords.length === 0) {
    foundKeywords.push(matchedCategory.toLowerCase());
  }

  // 3. Sentiment & Score
  let posMatches = 0;
  let negMatches = 0;
  for (const w of POSITIVE_WORDS) {
    if (lower.includes(w)) posMatches++;
  }
  for (const w of NEGATIVE_WORDS) {
    if (lower.includes(w)) negMatches++;
  }

  let sentiment: SentimentType = "neutral";
  let score = 0;

  if (rating !== null && rating !== undefined) {
    if (rating >= 4) {
      sentiment = "positive";
      score = 0.5 + Math.min(0.45, posMatches * 0.15);
    } else if (rating === 3) {
      sentiment = "neutral";
      score = (posMatches - negMatches) * 0.1;
    } else {
      sentiment = "negative";
      score = -0.5 - Math.min(0.45, negMatches * 0.15);
    }
  } else {
    if (negMatches > posMatches) {
      sentiment = "negative";
      score = -Math.min(0.95, 0.4 + negMatches * 0.2);
    } else if (posMatches > negMatches) {
      sentiment = "positive";
      score = Math.min(0.95, 0.4 + posMatches * 0.2);
    } else {
      sentiment = "neutral";
      score = 0;
    }
  }

  // 4. Severity (1 - 5)
  let severity = 1;
  if (sentiment === "negative") {
    if (
      lower.includes("crash") ||
      lower.includes("unusable") ||
      lower.includes("apple pay") ||
      lower.includes("payment") ||
      lower.includes("freeze")
    ) {
      severity = 5;
    } else if (
      lower.includes("disconnect") ||
      lower.includes("auto-renewal") ||
      lower.includes("week") ||
      lower.includes("delayed")
    ) {
      severity = 4;
    } else {
      severity = 3;
    }
  } else if (sentiment === "neutral") {
    severity = 2;
  } else {
    severity = 1;
  }

  // 5. One-line Summary
  const summary = `${matchedCategory}: ${foundKeywords.join(", ")} issue/observation`;

  return {
    sentiment,
    sentiment_score: Math.round(score * 100) / 100,
    category: matchedCategory,
    topics: foundKeywords,
    severity,
    summary,
  };
}
