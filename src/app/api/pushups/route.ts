import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "pushups.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return { entries: [], startDate: null, currentDay: 0 };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((getStartOfDay(b).getTime() - getStartOfDay(a).getTime()) / 86400000);
}

// GET /api/pushups — get pushup data
export async function GET() {
  const data = readData();
  const today = new Date();

  // Auto-advance day if new day since last entry
  let currentDay = data.currentDay;
  let lastEntryDate: string | null = null;

  if (data.entries.length > 0) {
    const lastEntry = data.entries[data.entries.length - 1];
    lastEntryDate = lastEntry.date;
    const lastDate = new Date(lastEntryDate + "T00:00:00");
    const daysSinceLast = daysBetween(lastDate, today);

    if (daysSinceLast >= 1) {
      // Advance day counter
      currentDay = lastEntry.day + daysSinceLast;
    }
  }

  // Today's entry
  const todayStr = today.toISOString().split("T")[0];
  const todayEntry = data.entries.find((e: any) => e.date === todayStr);

  // Last 30 days for chart
  const last30 = data.entries.slice(-30);

  // Stats
  const totalReps = data.entries.reduce((sum: number, e: any) => sum + (e.reps || 0), 0);
  const avgReps = data.entries.length > 0 ? Math.round(totalReps / data.entries.length) : 0;
  const maxReps = data.entries.length > 0 ? Math.max(...data.entries.map((e: any) => e.reps || 0)) : 0;
  const currentStreak = calculateStreak(data.entries, todayStr);

  return NextResponse.json({
    entries: data.entries,
    currentDay,
    todayReps: todayEntry?.reps || null,
    todayCompleted: !!todayEntry,
    totalDays: data.entries.length,
    totalReps,
    avgReps,
    maxReps,
    currentStreak,
    last30,
  });
}

// POST /api/pushups — log today's pushups
export async function POST(req: Request) {
  const body = await req.json();
  const { reps, day } = body;
  const data = readData();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Determine current day
  let currentDay = day || 1;
  if (data.entries.length > 0) {
    const lastEntry = data.entries[data.entries.length - 1];
    const lastDate = new Date(lastEntry.date + "T00:00:00");
    const daysSinceLast = daysBetween(lastDate, today);
    currentDay = lastEntry.day + daysSinceLast;
  }

  // Update or create today's entry
  const existingIdx = data.entries.findIndex((e: any) => e.date === todayStr);
  const entry = {
    date: todayStr,
    day: currentDay,
    reps: typeof reps === "number" ? reps : currentDay,
    timestamp: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    data.entries[existingIdx] = entry;
  } else {
    data.entries.push(entry);
  }

  data.entries.sort((a: any, b: any) => a.date.localeCompare(b.date));
  data.currentDay = currentDay;

  writeData(data);

  return NextResponse.json({ success: true, entry, currentDay });
}

function calculateStreak(entries: any[], todayStr: string) {
  if (!entries.length) return 0;
  const dates = entries.map((e: any) => e.date).sort();
  const lastDate = dates[dates.length - 1];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastDate !== todayStr && lastDate !== yesterdayStr) return 0;

  let streak = 0;
  let current = new Date(lastDate + "T00:00:00");
  const dateSet = new Set(dates);

  while (dateSet.has(current.toISOString().split("T")[0])) {
    streak++;
    current.setDate(current.getDate() - 1);
  }
  return streak;
}
