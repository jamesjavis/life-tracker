import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SLEEP_FILE = path.join(process.cwd(), "data", "sleep.json");
const HABITS_FILE = path.join(process.cwd(), "data", "habits.json");

function readSleep() {
  if (!fs.existsSync(SLEEP_FILE)) return { entries: [] };
  return JSON.parse(fs.readFileSync(SLEEP_FILE, "utf-8"));
}

function readHabits() {
  if (!fs.existsSync(HABITS_FILE)) return { habits: {} };
  return JSON.parse(fs.readFileSync(HABITS_FILE, "utf-8"));
}

export async function GET() {
  const sleep = readSleep();
  const habits = readHabits();
  const entries = sleep.entries || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const lastEntry = entries.length > 0
    ? [...entries].sort((a: any, b: any) => b.date.localeCompare(a.date))[0]
    : null;

  const lastEntryDate = lastEntry?.date || null;
  const lastDuration = lastEntry?.duration || null;
  const lastQuality = lastEntry?.quality || null;

  const gapDays = lastEntryDate
    ? Math.round((today.getTime() - new Date(lastEntryDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const avgSleep = entries.length > 0
    ? Math.round(entries.reduce((s: number, e: any) => s + e.duration, 0) / entries.length * 10) / 10
    : null;

  // Last 7 entries for recent average
  const last7 = entries.slice(-7);
  const avgLast7 = last7.length > 0
    ? Math.round(last7.reduce((s: number, e: any) => s + e.duration, 0) / last7.length * 10) / 10
    : null;

  // Calculate streak: consecutive days with 7+ hours
  const streak = (() => {
    let s = 0;
    const sorted = [...entries].sort((a: any, b: any) => b.date.localeCompare(a.date));
    for (const entry of sorted) {
      if (entry.duration >= 7) s++;
      else break;
    }
    return s;
  })();

  // Status
  const status = gapDays === null
    ? "no_data"
    : gapDays === 0
    ? "logged_today"
    : gapDays <= 2
    ? "recent"
    : gapDays <= 7
    ? "stale"
    : "comeback_needed";

  // Motivation
  const motivation = (() => {
    if (gapDays === null) return "No sleep data yet — start logging!";
    if (gapDays === 0) return "✅ Sleep logged today — keep it up!";
    if (gapDays === 1) return "😴 Yesterday's sleep logged — how'd you rest?";
    if (gapDays <= 3) return "🌙 Last sleep entry was before Easter — time to log again.";
    if (gapDays <= 7) return `📊 ${gapDays} days since last entry. Sleep tracking gap growing.`;
    return `⚠️ ${gapDays} days without sleep data. Your body needs rest tracking.`;
  })();

  // Comeback plan when gap >= 7 days
  const comebackPlan = gapDays !== null && gapDays >= 7
    ? {
        phase: gapDays >= 30 ? "restart" : "rebuild",
        targetEntries: gapDays >= 30 ? 3 : 7,
        targetDays: gapDays >= 30 ? 14 : 7,
        focus: gapDays >= 30
          ? "Rebuild the habit — log 7 nights, even if rough estimates."
          : "Get back on track — log last night's sleep and aim for consistent 7-8h.",
        tip: avgSleep
          ? `Your historical average is ${avgSleep}h/night. Aim for that consistently.`
          : "Start by estimating last night's sleep duration and quality.",
      }
    : null;

  // This month sessions
  const thisMonth = today.toISOString().slice(0, 7);
  const monthEntries = entries.filter((e: any) => e.date.startsWith(thisMonth));

  return NextResponse.json({
    lastEntry: lastEntry?.date || null,
    lastDuration: lastEntry?.duration || null,
    lastQuality: lastEntry?.quality || null,
    gapDays,
    avgSleep,
    avgLast7,
    totalEntries: entries.length,
    currentStreak: streak,
    loggedToday: lastEntry?.date === todayStr,
    thisMonthEntries: monthEntries.length,
    motivation,
    comebackPlan,
    status,
  });
}
