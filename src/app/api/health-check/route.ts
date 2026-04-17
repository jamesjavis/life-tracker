import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

interface DataFile {
  lastUpdated?: string;
  entries?: any[];
  [key: string]: any;
}

function readJSON(filename: string): DataFile {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return {};
  }
}

function getEntries(data: DataFile, dateKey: string): any[] {
  if (Array.isArray(data[dateKey])) return data[dateKey];
  if (typeof data[dateKey] === "object" && data[dateKey] !== null) return [];
  return [];
}

function getLastDate(entries: any[], dateField = "date"): string | null {
  if (!entries.length) return null;
  return entries[entries.length - 1]?.[dateField] ?? null;
}

function daysAgo(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

// GET /api/health-check - Returns data gaps across all tracker files
export async function GET() {
  const files = [
    { file: "sleep.json", label: "Sleep", dateKey: "entries", dateField: "date" },
    { file: "mood.json", label: "Mood", dateKey: "entries", dateField: "date" },
    { file: "habits.json", label: "Habits", dateKey: "habits", dateField: null },
    { file: "finance.json", label: "Finance", dateKey: null, dateField: "lastUpdated" },
    { file: "gym.json", label: "Gym", dateKey: "entries", dateField: "date" },
    { file: "water.json", label: "Water", dateKey: "entries", dateField: "date" },
    { file: "weight.json", label: "Weight", dateKey: "entries", dateField: "date" },
    { file: "wellness.json", label: "Wellness", dateKey: "entries", dateField: "date" },
    { file: "meals.json", label: "Meals", dateKey: "entries", dateField: "date" },
    { file: "networth-history.json", label: "Net Worth", dateKey: null, dateField: null },
  ];

  const today = new Date().toISOString().split("T")[0];
  const results = [];

  for (const { file, label, dateKey, dateField } of files) {
    const data = readJSON(file);
    
    if (file === "habits.json") {
      // Habits: find last date with any entries
      const habitDates = Object.keys(data.habits || {}).sort();
      const lastHabitDate = habitDates.length > 0 ? habitDates[habitDates.length - 1] : null;
      const gap = daysAgo(lastHabitDate);
      results.push({ label, file, lastDate: lastHabitDate, daysAgo: gap, status: gap !== null && gap > 3 ? "stale" : "ok" });
    } else if (file === "finance.json") {
      const gap = daysAgo(data.lastUpdated ?? null);
      results.push({ label, file, lastDate: data.lastUpdated ?? null, daysAgo: gap, status: gap !== null && gap > 7 ? "stale" : "ok" });
    } else if (file === "networth-history.json") {
      const entries = Array.isArray(data) ? data : [];
      const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;
      const lastDate = lastEntry?.date ?? null;
      const gap = daysAgo(lastDate);
      results.push({ label, file, lastDate, daysAgo: gap, status: gap !== null && gap > 30 ? "stale" : "ok" });
    } else if (dateKey) {
      const entries = getEntries(data, dateKey);
      const lastDate = getLastDate(entries, dateField ?? "date");
      const gap = daysAgo(lastDate);
      results.push({ label, file, lastDate, daysAgo: gap, status: gap !== null && gap > 3 ? "stale" : "ok" });
    }
  }

  const stale = results.filter(r => r.status === "stale");
  const healthy = results.filter(r => r.status === "ok");

  return NextResponse.json({
    generated: today,
    summary: { total: results.length, healthy: healthy.length, stale: stale.length },
    dataFiles: results,
    action: stale.length > 0 ? "Some data files need updating. Review stale entries." : "All data files are healthy."
  });
}