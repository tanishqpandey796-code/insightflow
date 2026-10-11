# InsightFlow — Intelligent Customer Feedback & Decision Platform
> **Build Battle 2026 (Frontend Arena)** · Individual 48h Challenge · [Live App Demo](#)

InsightFlow turns raw, scattered customer feedback (app store reviews, surveys, CSAT tickets) into sentiment metrics, recurring topic clusters, prioritized bottlenecks, and actionable engineering recommendations.

Built and validated with the official **Build Battle 2026 Customer Feedback Dataset** (7,000 rows across 4 categories).

---

## 🌟 Features Mapped to Hackathon Requirements

### 1. Feedback Management (FR1)
- **Official Dataset Ingestion (1-Click)**: Instant loading of `BuildBattle_2026_Customer_Feedback_Dataset.csv` (7,000 rows).
- **Automated Exact Deduplication**: Normalizes review text and collapses exact duplicates (7,000 raw rows &rarr; **320 unique reviews** with occurrence weights).
- **User CSV Upload**: Supports custom CSV imports up to **10,000 rows / 5 MB** with drag-and-drop, column mapping (`review` &rarr; text, `category` &rarr; category), and preview table.
- **Feedback Explorer**: Fast search, filtering by category and sentiment, occurrence badges (`245×`), pagination, CSV export, and detail drawer. Missing fields (rating, source, customer) display `-` without fabricating data.

### 2. AI-Powered Analysis (FR2)
- **Semantic Classification on Unique Reviews**: AI analysis runs strictly on the 320 unique reviews, then maps results to all rows via text hash.
- **Category Preservation**: Categories from the CSV (`Fraud and Scam`, `Operational Issues`, `Customer Service`, `Product Feedback`) are preserved as-is.
- **Multi-Factor Urgency**: Sentiment (-1.0 to 1.0), severity rating (1 to 5), extracted topic tags, and concise summaries.
- **Deterministic Fallback**: Resilient rule-based lexical analyzer if LLM is offline or unconfigured.

### 3. Analytics Dashboard (FR3)
- **Weighted Real Numbers**: All KPIs, percentages, and chart totals are strictly weighted by `occurrence_count` (totaling 7,000).
- **Simulated Timeline**: Because the official dataset has no native timestamps, trend charts display: *"Simulated timeline (dataset has no dates — 7,000 rows spread by sequence over 90 days)"*.
- **Interactive Recharts**:
  - Sentiment Distribution (Donut with positive center %)
  - Sentiment Trends Over Time (Multi-line trajectory)
  - Category Volume Breakdown (4 official categories horizontal bar)
  - Top Complaint Topics (Weighted negative frequency)
  - Ingestion Density Timeline (Area chart)

### 4. Intelligent Recommendations (FR4)
- **Mathematical Multi-Factor Priority Formula**:
  $$\text{Priority} = 100 \times \left(0.35 \times \text{freq} + 0.25 \times \text{neg\_share} + 0.20 \times \text{severity} + 0.20 \times \text{trend}\right)$$
- **Score Classification**: Critical ($\ge 70$), High ($40 - 69$), Medium ($< 40$).
- **Capped Trend Indicators**: Capped at `>500%` or `"New spike"` when previous base is $<5$.
- **Grounded AI Actions**: Tactical recommendations, expected impacts, effort ratings (S/M/L), suggested team owners, and real dataset customer quotes.
- **"Why This Matters" Panel**: Transparently displays the 4 component weights and raw numbers driving the score.

### 5. Reports & Issue Tracking (FR5)
- **1-Click Issue Tracking**: "Track this issue" generates a snapshot-backed task on the Kanban board (`/issues`).
- **Kanban Board**: Open, In Progress, and Resolved columns with notes editor.
- **Executive Report (`/report`)**: Board-ready briefing with Print-to-PDF (`@media print` CSS), Markdown export, and shareable read-only link generation (`/r/[token]`).

---

## 🛡️ Dedicated Section: How Adaption is Used

InsightFlow uses Adaption’s **Adaptive Data API** (`lib/adaption.ts`) as the **data-preparation and quality gate** before any AI analysis takes place:

### What Was Implemented:
1. **Deduplication Pre-Processing**: When the 7,000-row feedback dataset is ingested, InsightFlow normalizes the text (trim, case-insensitive compare) and groups exact duplicates into 320 unique reviews with their exact `occurrence_count`.
2. **Quality Gate Upload**: The unique review set is submitted to Adaption (`/api/v1/datasets`) as the main text vector column.
3. **Adaptive Cleaning Pipeline**: Adaption runs unicode normalization, whitespace stripping, and artifact noise reduction.
4. **Quality Evaluation**: Retrieves the quality score (96.4 / 100) and evaluation report (`/{id}/evaluation`).
5. **Adapted Text Storage**: The adapted text is saved back to `feedback.cleaned_text` and passed to the downstream sentiment and topic analyzer.
6. **Data Quality Card**: Surfaces the live pipeline audit across the Landing page, Dashboard, and Reports:
   - **Rows In**: 7,000 raw submissions
   - **Duplicates Removed**: 6,680 exact noise entries collapsed
   - **Unique Kept**: 320 unique reviews
   - **Quality Score**: 96.4 / 100 (Clean rate: 99.5%)
7. **Graceful Fallback**: If Adaption API exceeds 90s or fails, status is marked `"skipped"` and local adaptive cleaning operates seamlessly—never blocking the user.

---

## 🏗️ Architecture

```
BuildBattle_2026_Customer_Feedback_Dataset.csv (7,000 rows)
                          │
                          ▼
        Exact Deduplication & Normalization
            (7,000 rows ──► 320 unique reviews)
                          │
                          ▼
            Adaption Adaptive Data API
        (Noise reduction & Quality Gate: 96.4/100)
                          │
                          ▼
            Cleaned Text (`cleaned_text`)
                          │
                          ▼
           AI Sentiment & Topic Analyzer
      (Analyzes 320 unique reviews ──► Maps via hash)
                          │
                          ▼
      Weighted Priority Engine (Occurrence weighted)
                          │
                          ▼
      Dashboard · Recommendations · Kanban · Executive Report
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local`:
```env
# Optional: Supabase / Postgres connection
DATABASE_URL=

# Adaption Adaptive Data API (https://docs.adaptionlabs.ai)
ADAPTION_API_KEY=
ADAPTION_BASE_URL=https://api.prod.adaptionlabs.ai

# LLM Provider (gemini | openai | anthropic)
LLM_PROVIDER=gemini
LLM_API_KEY=
GEMINI_API_KEY=

# Public URL for shareable report links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Running Locally

```bash
npm install
npm run build
npm run dev
```
Open [http://127.0.0.1:3000](http://127.0.0.1:3000) and click **"Load Sample Data (1-Click)"** to load the official 7,000-row dataset!
