import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { berlinNow, berlinDateStr } from "@/lib/date";

const DEFAULT_DATA = { entries: [], startDate: null, currentDay: 0, todayCompleted: false };

function getStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((getStartOfDay(b).getTime() - getStartOfDay(a).getTime()) / 86400000);
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

// GET /api/pushups — get pushup data
export async function GET() {
  const data = (await storage.get("pushups")) ?? DEFAULT_DATA;
  const today = berlinNow();
  const todayStr = berlinDateStr();

  let currentDay = data.currentDay;
  if (data.entries.length > 0) {
    const lastEntry = data.entries[data.entries.length - 1];
    const lastDate = new Date(lastEntry.date + "T00:00:00");
    const daysSinceLast = daysBetween(lastDate, today);
    if (daysSinceLast >= 1) {
      currentDay = lastEntry.day + daysSinceLast;
    }
  }

  const todayEntry = data.entries.find((e: any) => e.date === todayStr);
  const last30 = data.entries.slice(-30);
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

// POST /api/pushups — log today's pushups OR retro-log past dates
export async function POST(req: Request) {
  const body = await req.json();
  const data = (await storage.get("pushups")) ?? DEFAULT_DATA;
  const todayStr = berlinDateStr();

  // Retro-log: accept { action: "retro", date: "YYYY-MM-DD", day?: number, reps?: number }
  if (body.action === "retro") {
    const retroDate = body.date;
    if (!retroDate) return NextResponse.json({ error: "Missing date for retro" }, { status: 400 });

    let entryDay: number;
    if (typeof body.day === "number") {
      entryDay = body.day;
    } else if (data.entries.length > 0) {
      const lastEntry = data.entries[data.entries.length - 1];
      const lastDate = new Date(lastEntry.date + "T00:00:00");
      const retroDateObj = new Date(retroDate + "T00:00:00");
      const gap = daysBetween(lastDate, retroDateObj);
      entryDay = lastEntry.day + gap;
    } else {
      entryDay = 1;
    }

    const entry = {
      date: retroDate,
      day: entryDay,
      reps: typeof body.reps === "number" ? body.reps : entryDay,
      timestamp: new Date().toISOString(),
    };

    const existingIdx = data.entries.findIndex((e: any) => e.date === retroDate);
    if (existingIdx >= 0) data.entries[existingIdx] = entry;
    else { data.entries.push(entry); }
    data.entries.sort((a: any, b: any) => a.date.localeCompare(b.date));

    if (data.entries.length > 0) {
      const lastEntry = data.entries[data.entries.length - 1];
      data.currentDay = lastEntry.day;
    }
    await storage.set("pushups", data);
    return NextResponse.json({ success: true, entry });
  }

  // Normal log: today's pushups
  const { reps, day } = body;
  let currentDay = day || 1;
  if (data.entries.length > 0) {
    const lastEntry = data.entries[data.entries.length - 1];
    const lastDate = new Date(lastEntry.date + "T00:00:00");
    const today = berlinNow();
    const daysSinceLast = daysBetween(lastDate, today);
    currentDay = lastEntry.day + daysSinceLast;
  }

  const entry = {
    date: todayStr,
    day: currentDay,
    reps: typeof reps === "number" ? reps : currentDay,
    timestamp: new Date().toISOString(),
  };

  const existingIdx = data.entries.findIndex((e: any) => e.date === todayStr);
  if (existingIdx >= 0) {
    data.entries[existingIdx] = entry;
  } else {
    data.entries.push(entry);
  }
  data.entries.sort((a: any, b: any) => a.date.localeCompare(b.date));
  data.currentDay = currentDay;
  await storage.set("pushups", data);

  return NextResponse.json({ success: true, entry, currentDay });
}
