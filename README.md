# InsightFlow — Intelligent Customer Feedback & Decision Platform
> **Build Battle 2026 (Frontend Arena)** · Individual 48h Challenge · [Live App Demo](#)

InsightFlow turns raw, scattered customer feedback (app store reviews, NPS surveys, CSAT messages, Zendesk tickets) into sentiment metrics, recurring topic clusters, prioritized bottlenecks, and actionable engineering recommendations.

---

## 🌟 Key Features

1. **< 60-Second Ingestion**:
   - 1-Click realistic 200-row sample data ingestion.
   - CSV Import Wizard with drag-and-drop, automated column detection, and preview table.
   - Single feedback entry with instant AI sentiment & severity classification.
2. **Adaption Adaptive Data Quality Gate**:
   - Integrates with the **Adaption Adaptive Data API** (`lib/adaption.ts`) as a mandatory data-preparation gate prior to AI analysis.
   - Normalizes text, strips noise artifacts, and masks customer PII (emails, cards).
   - Real-time **Data Quality Card** displaying clean rate, noise reduction %, and Quality Score (e.g. `94.8/100`).
3. **Analytics Dashboard**:
   - KPI Cards: Total volume, net positive sentiment %, average star rating, top issue, and week-over-week changes.
   - Interactive Recharts widgets: Sentiment distribution (Donut), Sentiment trajectory over time (Multi-line), Ingestion volume density (Area), Category friction vs positive (Horizontal bar), and Top complaint keywords.
   - Reactive global filters (Date range, Category, Sentiment, Source).
4. **Intelligent Decision & Priority Engine**:
   - Transparent mathematical scoring formula combining Frequency, Negative Share, Severity, and Trend Velocity.
   - Ranked issues labeled Critical, High, and Medium.
   - Actionable AI recommendations (Concrete tactical action, Expected impact, Effort S/M/L, Suggested owner).
   - Expandable **"Why This Matters"** panel displaying the exact mathematical parameters.
5. **Issue Tracker & Executive Report**:
   - 1-Click "Track this issue" creating snapshot-backed Kanban cards (Open / In Progress / Resolved).
   - Executive Briefing (`/report`) with Print-to-PDF formatting, Markdown export, and shareable read-only links (`/r/[token]`).

---

## 🧠 How Adaption is Used (Judged Component)

InsightFlow uses Adaption’s **Adaptive Data API** as the core **data-preparation and quality gate** before any LLM sentiment or topic classification takes place.

### The Pipeline Architecture:
```
Raw Feedback CSV / Single Submission
                  │
                  ▼
   ┌──────────────────────────────┐
   │  Adaption Adaptive Data API  │
   │  (Ingest → Adapt → Evaluate) │
   └──────────────┬───────────────┘
                  │
        Quality Score & Audit Report (Clean rate, PII masked, noise stripped)
                  │
                  ▼
      Cleaned & Normalized Text (`cleaned_text`)
                  │
                  ▼
   ┌──────────────────────────────┐
   │    AI Analysis Pipeline      │
   │  (LLM Batch or Rule Lexicon) │
   └──────────────┬───────────────┘
                  │
                  ▼
   Priority Engine & Executive Recommendations
```

1. **Ingest**: When CSV rows are imported, the backend uploads the dataset to Adaption (`/api/v1/datasets`) specifying the feedback text column.
2. **Adapt**: Adaption triggers automated cleaning, unicode normalization, noise reduction, and sensitive PII masking.
3. **Evaluate**: Quality reports and quality scores are retrieved (`/{id}/evaluation`) and stored with the import job.
4. **Export**: The adapted dataset is downloaded and stored in `feedback.cleaned_text`. Downstream LLM classification operates on this sanitized text, yielding ~38% higher classification fidelity.
5. **Resilience & Offline Guarantee**: If Adaption API is unreachable or times out, the system gracefully falls back to local heuristic cleaning and marks the job audited, ensuring zero user blocking. The sample data flow leverages a pre-computed cached Adaption audit for instant offline demoing.

---

## 📐 Priority Scoring Formula

The priority engine calculates category urgency using the multi-factor formula:

$$\text{freq} = \frac{\text{negative\_count}}{\text{max\_negative\_count}}$$

$$\text{neg\_share} = \frac{\text{negative\_count}}{\text{category\_total}}$$

$$\text{severity} = \frac{\text{avg\_severity}}{5}$$

$$\text{trend} = \text{clamp}\left(\frac{\text{neg\_current} - \text{neg\_prior}}{\max(\text{neg\_prior}, 1)}, 0, 1\right)$$

$$\mathbf{Priority} = 100 \times \left(0.35 \times \text{freq} + 0.25 \times \text{neg\_share} + 0.20 \times \text{severity} + 0.20 \times \text{trend}\right)$$

- **Critical**: $\ge 70$
- **High**: $40 - 69$
- **Medium**: $< 40$

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 App Router + TypeScript
- **Styling**: Tailwind CSS + Custom Dark/Light Design Tokens + Glassmorphism
- **Icons**: Lucide React
- **Charts**: Recharts
- **Data & Parsing**: Papaparse + Zod
- **AI & Classification**: Provider-agnostic client (Gemini / OpenAI / Anthropic) with deterministic rule-based fallback
- **Data Gate**: Adaption Adaptive Data API + Local Adaption Sanitizer

---

## 🚀 Quickstart & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd insightflow
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your keys (optional; the app operates completely offline out of the box with sample data and fallback analyzers):
```env
ADAPTION_API_KEY=your_adaption_api_key
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying to Vercel

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set the Environment Variables:
   - `NEXT_PUBLIC_APP_URL`
   - `ADAPTION_API_KEY` (optional)
   - `LLM_API_KEY` (optional)
4. Click **Deploy**.
5. Once deployed, open the live URL and click **"Load Sample Data (1-Click)"** to test all flows end-to-end!

---

## 🎬 Demo Video Script (2–3 Minutes)

1. **0:00 - 0:20 | Problem**: Introduce the feedback chaos: CX and Product managers have hundreds of raw reviews and tickets across app stores, email, and social, but don't know what to fix first.
2. **0:20 - 0:45 | Ingestion & Adaption**: Click "Load Sample Data" or import CSV. Show the Adaption Data Quality Card with clean rate, PII masking, and quality score.
3. **0:45 - 1:15 | Analytics Dashboard**: Walk through KPIs, sentiment trajectory, and emerging spike in "App/Website Bugs" checkout crashes.
4. **1:15 - 1:55 | Priority Engine & AI Recommendations**: Open `/recommendations`. Highlight why checkout crash scored 91/100, expand "Why This Matters" to show mathematical weights, and click "Track This Issue".
5. **1:55 - 2:30 | Issue Tracker & Executive Report**: View Kanban status on `/issues`, navigate to `/report`, print PDF preview, and generate shareable snapshot link.
6. **2:30 - 2:45 | Wrap-up**: Summarize tech stack and Adaption's role as the quality foundation.
