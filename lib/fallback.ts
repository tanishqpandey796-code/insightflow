import { CategoryType, SentimentType } from "@/types";

interface RuleAnalysisResult {
  sentiment: SentimentType;
  sentiment_score: number;
  category: CategoryType;
  topics: string[];
  severity: number;
  summary: string;
}

export function analyzeFeedbackRuleBased(
  text: string,
  existingCategory?: string | null,
  rating?: number | null
): RuleAnalysisResult {
  const lower = text.toLowerCase().trim();

  // 1. Category: Always preserve existingCategory if given!
  let category: CategoryType = "Other";
  if (existingCategory) {
    const cleanCat = existingCategory.trim();
    if (
      cleanCat === "Fraud and Scam" ||
      cleanCat === "Customer Service" ||
      cleanCat === "Operational Issues" ||
      cleanCat === "Product Feedback"
    ) {
      category = cleanCat as CategoryType;
    } else {
      category = (cleanCat as any) || "Other";
    }
  } else {
    // Heuristic category if missing
    if (lower.includes("scam") || lower.includes("fraud") || lower.includes("counterfeit") || lower.includes("charge")) {
      category = "Fraud and Scam";
    } else if (lower.includes("service") || lower.includes("support") || lower.includes("agent") || lower.includes("representative")) {
      category = "Customer Service";
    } else if (lower.includes("delivery") || lower.includes("shipping") || lower.includes("website") || lower.includes("glitch") || lower.includes("order")) {
      category = "Operational Issues";
    } else {
      category = "Product Feedback";
    }
  }

  // 2. Sentiment Determination with negation handling
  // Crucial: check for positive statements about fraud like "No fraudulent activity detected", "I was not a victim of fraud"
  const isFalseAlarmFraud =
    lower.includes("no signs of fraudulent activity") ||
    lower.includes("no fraudulent activity") ||
    lower.includes("was not a victim of fraud") ||
    lower.includes("not a victim of fraud");

  const strongNegatives = [
    "scammed", "victim of fraud", "counterfeit", "unresponsive", "disappointed",
    "never sent", "never received", "stopped working", "not helpful", "remains unresolved",
    "defects", "delayed by two weeks", "delayed by a week", "charged multiple times",
    "additional payment", "glitches", "kept crashing", "crashing", "damaged", "missing",
    "terrible", "frustrating", "inconvenient", "wrong items", "took my money"
  ];

  const strongPositives = [
    "greatly improved", "helpful and resolved", "exceeded my expectations",
    "knowledgeable and provided", "perfect condition", "quick resolution",
    "met all my expectations", "on time and", "outstanding", "great experience",
    "friendly and efficient", "very professional", "durable and well-made",
    "great value for money", "innovative and very useful", "highly recommended"
  ];

  let hasNeg = false;
  if (!isFalseAlarmFraud) {
    for (const phrase of strongNegatives) {
      if (lower.includes(phrase)) {
        hasNeg = true;
        break;
      }
    }
  }

  let hasPos = false;
  for (const phrase of strongPositives) {
    if (lower.includes(phrase)) {
      hasPos = true;
      break;
    }
  }

  if (isFalseAlarmFraud) {
    hasPos = true;
  }

  let sentiment: SentimentType = "neutral";
  let score = 0;

  if (hasNeg && !hasPos) {
    sentiment = "negative";
    score = -0.75;
  } else if (hasPos && !hasNeg) {
    sentiment = "positive";
    score = 0.8;
  } else if (hasNeg && hasPos) {
    // Mixed e.g. "minor issue but seller resolved"
    if (lower.includes("resolved") || lower.includes("provided a replacement") || lower.includes("was quick")) {
      sentiment = "positive";
      score = 0.45;
    } else {
      sentiment = "negative";
      score = -0.55;
    }
  } else {
    sentiment = "neutral";
    score = 0.05;
  }

  // 3. Severity (1 - 5)
  let severity = 1;
  if (sentiment === "negative") {
    if (
      lower.includes("took my money") ||
      lower.includes("victim of fraud") ||
      lower.includes("charged multiple times") ||
      lower.includes("scammed") ||
      lower.includes("counterfeit")
    ) {
      severity = 5;
    } else if (
      lower.includes("never received") ||
      lower.includes("stopped working") ||
      lower.includes("kept crashing") ||
      lower.includes("delayed by two weeks") ||
      lower.includes("unresponsive")
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

  // 4. Topic Extraction
  const topics: string[] = [];
  if (lower.includes("scam") || lower.includes("fraud")) topics.push("seller fraud");
  if (lower.includes("counterfeit")) topics.push("counterfeit item");
  if (lower.includes("additional payment")) topics.push("extortion/extra fee");
  if (lower.includes("charged multiple times")) topics.push("duplicate charges");
  if (lower.includes("delivery") || lower.includes("delayed")) topics.push("delayed shipping");
  if (lower.includes("damaged") || lower.includes("packaging")) topics.push("damaged packaging");
  if (lower.includes("missing")) topics.push("missing items");
  if (lower.includes("glitch") || lower.includes("crashing")) topics.push("website crash");
  if (lower.includes("unresponsive") || lower.includes("not helpful")) topics.push("unresponsive support");
  if (lower.includes("stopped working") || lower.includes("defects")) topics.push("product defects");
  if (lower.includes("durable") || lower.includes("quality")) topics.push("build quality");
  if (lower.includes("innovative") || lower.includes("features")) topics.push("product features");
  if (lower.includes("value for money")) topics.push("pricing value");

  if (topics.length === 0) {
    topics.push(category.toLowerCase());
  }

  // 5. Summary
  const summary = `${category}: ${topics.slice(0, 2).join(", ")} (${sentiment})`;

  return {
    sentiment,
    sentiment_score: score,
    category,
    topics: topics.slice(0, 3),
    severity,
    summary,
  };
}
