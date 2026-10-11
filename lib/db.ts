import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Feedback, ImportJob, Issue, Report, FilterOptions } from "@/types";

interface DatabaseSchema {
  import_jobs: ImportJob[];
  feedback: Feedback[];
  issues: Issue[];
  reports: Report[];
}

const DB_FILE = path.join(process.cwd(), "data", "db.json");

function ensureDbFile(): void {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial: DatabaseSchema = {
      import_jobs: [],
      feedback: [],
      issues: [],
      reports: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

function readDb(): DatabaseSchema {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading db file, reinitializing", err);
    const initial: DatabaseSchema = {
      import_jobs: [],
      feedback: [],
      issues: [],
      reports: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

function writeDb(data: DatabaseSchema): void {
  ensureDbFile();
  const tmpFile = `${DB_FILE}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpFile, DB_FILE);
}

export const db = {
  // --- Import Jobs ---
  importJobs: {
    create(job: Omit<ImportJob, "id" | "created_at">): ImportJob {
      const dbData = readDb();
      const newJob: ImportJob = {
        ...job,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      dbData.import_jobs.unshift(newJob);
      writeDb(dbData);
      return newJob;
    },
    getById(id: string): ImportJob | null {
      const dbData = readDb();
      return dbData.import_jobs.find((j) => j.id === id) || null;
    },
    update(id: string, updates: Partial<ImportJob>): ImportJob | null {
      const dbData = readDb();
      const idx = dbData.import_jobs.findIndex((j) => j.id === id);
      if (idx === -1) return null;
      dbData.import_jobs[idx] = { ...dbData.import_jobs[idx], ...updates };
      writeDb(dbData);
      return dbData.import_jobs[idx];
    },
    list(limit = 10): ImportJob[] {
      const dbData = readDb();
      return dbData.import_jobs.slice(0, limit);
    },
    getLatest(): ImportJob | null {
      const dbData = readDb();
      return dbData.import_jobs[0] || null;
    },
  },

  // --- Feedback ---
  feedback: {
    create(item: Omit<Feedback, "id">): Feedback {
      const dbData = readDb();
      const newItem: Feedback = {
        ...item,
        occurrence_count: item.occurrence_count || 1,
        id: crypto.randomUUID(),
      };
      dbData.feedback.unshift(newItem);
      writeDb(dbData);
      return newItem;
    },
    createMany(items: Omit<Feedback, "id">[]): Feedback[] {
      const dbData = readDb();
      const created: Feedback[] = items.map((item) => ({
        ...item,
        occurrence_count: item.occurrence_count || 1,
        id: crypto.randomUUID(),
      }));
      dbData.feedback = [...created, ...dbData.feedback];
      writeDb(dbData);
      return created;
    },
    getById(id: string): Feedback | null {
      const dbData = readDb();
      return dbData.feedback.find((f) => f.id === id) || null;
    },
    update(id: string, updates: Partial<Feedback>): Feedback | null {
      const dbData = readDb();
      const idx = dbData.feedback.findIndex((f) => f.id === id);
      if (idx === -1) return null;
      dbData.feedback[idx] = { ...dbData.feedback[idx], ...updates };
      writeDb(dbData);
      return dbData.feedback[idx];
    },
    batchUpdateAnalysis(
      updates: Array<{
        id: string;
        sentiment: Feedback["sentiment"];
        sentiment_score: number;
        category: Feedback["category"];
        topics: string[];
        severity: number;
        summary: string;
      }>
    ): void {
      const dbData = readDb();
      const map = new Map(updates.map((u) => [u.id, u]));
      const now = new Date().toISOString();
      for (const item of dbData.feedback) {
        if (map.has(item.id)) {
          const u = map.get(item.id)!;
          item.sentiment = u.sentiment;
          item.sentiment_score = u.sentiment_score;
          if (u.category) item.category = u.category;
          item.topics = u.topics;
          item.severity = u.severity;
          item.summary = u.summary;
          item.analyzed_at = now;
        }
      }
      writeDb(dbData);
    },
    updateCleanedText(id: string, cleanedText: string): void {
      const dbData = readDb();
      const item = dbData.feedback.find((f) => f.id === id);
      if (item) {
        item.cleaned_text = cleanedText;
        writeDb(dbData);
      }
    },
    list(options: FilterOptions = {}): {
      items: Feedback[];
      total: number;
      totalWeighted: number;
      uniqueCount: number;
      page: number;
      pageSize: number;
    } {
      const dbData = readDb();
      let filtered = [...dbData.feedback];

      // Text search
      if (options.q && options.q.trim()) {
        const query = options.q.toLowerCase().trim();
        filtered = filtered.filter(
          (f) =>
            f.text.toLowerCase().includes(query) ||
            (f.summary && f.summary.toLowerCase().includes(query)) ||
            (f.topics && f.topics.some((t) => t.toLowerCase().includes(query)))
        );
      }

      // Filter by category
      if (options.category && options.category !== "all") {
        filtered = filtered.filter((f) => f.category === options.category);
      }

      // Filter by sentiment
      if (options.sentiment && options.sentiment !== "all") {
        filtered = filtered.filter((f) => f.sentiment === options.sentiment);
      }

      // Filter by source (if present)
      if (options.source && options.source !== "all") {
        filtered = filtered.filter((f) => f.source === options.source);
      }

      // Filter by rating (if present)
      if (options.rating && options.rating !== "all") {
        const r = parseInt(options.rating, 10);
        if (!isNaN(r)) {
          filtered = filtered.filter((f) => f.rating === r);
        }
      }

      // Date range
      if (options.from) {
        const fromDate = new Date(options.from).getTime();
        if (!isNaN(fromDate)) {
          filtered = filtered.filter((f) => new Date(f.created_at).getTime() >= fromDate);
        }
      }
      if (options.to) {
        const toDate = new Date(options.to).getTime();
        if (!isNaN(toDate)) {
          filtered = filtered.filter((f) => new Date(f.created_at).getTime() <= toDate);
        }
      }

      // Sort by occurrence_count desc, then date desc
      filtered.sort((a, b) => {
        const countDiff = (b.occurrence_count || 1) - (a.occurrence_count || 1);
        if (countDiff !== 0) return countDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      const uniqueCount = filtered.length;
      const totalWeighted = filtered.reduce((acc, curr) => acc + (curr.occurrence_count || 1), 0);
      const page = options.page ? Math.max(1, options.page) : 1;
      const pageSize = options.pageSize ? Math.max(1, options.pageSize) : 20;
      const start = (page - 1) * pageSize;
      const paginated = filtered.slice(start, start + pageSize);

      return {
        items: paginated,
        total: uniqueCount,
        totalWeighted,
        uniqueCount,
        page,
        pageSize,
      };
    },
    getAll(options: Omit<FilterOptions, "page" | "pageSize"> = {}): Feedback[] {
      return db.feedback.list({ ...options, page: 1, pageSize: 100000 }).items;
    },
    getUnanalyzed(limit = 100, importJobId?: string): Feedback[] {
      const dbData = readDb();
      return dbData.feedback
        .filter((f) => !f.analyzed_at && (!importJobId || f.import_job_id === importJobId))
        .slice(0, limit);
    },
    count(): { totalWeighted: number; uniqueCount: number } {
      const dbData = readDb();
      const uniqueCount = dbData.feedback.length;
      const totalWeighted = dbData.feedback.reduce(
        (acc, curr) => acc + (curr.occurrence_count || 1),
        0
      );
      return { totalWeighted, uniqueCount };
    },
    deleteAll(): void {
      const dbData = readDb();
      dbData.feedback = [];
      dbData.import_jobs = [];
      writeDb(dbData);
    },
  },

  // --- Issues ---
  issues: {
    create(issue: Omit<Issue, "id" | "created_at" | "updated_at">): Issue {
      const dbData = readDb();
      const now = new Date().toISOString();
      const newIssue: Issue = {
        ...issue,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
      };
      dbData.issues.unshift(newIssue);
      writeDb(dbData);
      return newIssue;
    },
    list(): Issue[] {
      const dbData = readDb();
      return [...dbData.issues].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    },
    getById(id: string): Issue | null {
      const dbData = readDb();
      return dbData.issues.find((i) => i.id === id) || null;
    },
    update(id: string, updates: Partial<Omit<Issue, "id" | "created_at">>): Issue | null {
      const dbData = readDb();
      const idx = dbData.issues.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      dbData.issues[idx] = {
        ...dbData.issues[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      writeDb(dbData);
      return dbData.issues[idx];
    },
    delete(id: string): boolean {
      const dbData = readDb();
      const initialLen = dbData.issues.length;
      dbData.issues = dbData.issues.filter((i) => i.id !== id);
      if (dbData.issues.length !== initialLen) {
        writeDb(dbData);
        return true;
      }
      return false;
    },
  },

  // --- Reports ---
  reports: {
    create(report: Omit<Report, "id" | "created_at">): Report {
      const dbData = readDb();
      const newReport: Report = {
        ...report,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      dbData.reports.unshift(newReport);
      writeDb(dbData);
      return newReport;
    },
    getByToken(token: string): Report | null {
      const dbData = readDb();
      return dbData.reports.find((r) => r.share_token === token) || null;
    },
    list(limit = 20): Report[] {
      const dbData = readDb();
      return dbData.reports.slice(0, limit);
    },
  },
};
