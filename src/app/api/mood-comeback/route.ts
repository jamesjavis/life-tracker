import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MOOD_FILE = path.join(process.cwd(), "data", "mood.json");

function readMood() {
  if (!fs.existsSync(MOOD_FILE)) return { entries: [] };
  return JSON.parse(fs.readFileSync(MOOD_FILE, "utf-8"));
}

export async function GET() {
  const mood = readMood();
  const entries = mood.entries || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const lastEntry = entries.length > 0
    ? [...entries].sort((a: any, b: any) => b.date.localeCompare(a.date))[0]
    : null;

  const lastEntryDate = lastEntry?.date || null;

  const gapDays = lastEntryDate
    ? Math.round((today.getTime() - new Date(lastEntryDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const avgMood = entries.length > 0
    ? Math.round(entries.reduce((s: number, e: any) => s + (e.mood || 0), 0) / entries.length * 10) / 10
    : null;

  const avgEnergy = entries.length > 0
    ? Math.round(entries.reduce((s: number, e: any) => s + (e.energy || 0), 0) / entries.length * 10) / 10
    : null;

  // Mood/Energy streaks (days meeting goal of 7)
  const MOOD_GOAL = 7;
  const moodStreak = (() => {
    let s = 0;
    const sorted = [...entries].sort((a: any, b: any) => b.date.localeCompare(a.date));
    for (const entry of sorted) {
      if ((entry.mood || 0) >= MOOD_GOAL) s++;
      else break;
    }
    return s;
  })();

  const energyStreak = (() => {
    let s = 0;
    const sorted = [...entries].sort((a: any, b: any) => b.date.localeCompare(a.date));
    for (const entry of sorted) {
      if ((entry.energy || 0) >= MOOD_GOAL) s++;
      else break;
    }
    return s;
  })();

  // Last 7 entries for recent average
  const last7 = entries.slice(-7);
  const avgLast7Mood = last7.length > 0
    ? Math.round(last7.reduce((s: number, e: any) => s + (e.mood || 0), 0) / last7.length * 10) / 10
    : null;

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
    if (gapDays === null) return "No mood data yet — start tracking how you feel!";
    if (gapDays === 0) return "✅ Mood logged today — self-awareness is strength.";
    if (gapDays === 1) return "😌 Yesterday's mood logged — keep tracking the pattern.";
    if (gapDays <= 3) return "🌤️ A few days gap — mood patterns are worth tracking.";
    if (gapDays <= 7) return `📊 ${gapDays} days without a mood entry. Patterns emerge with consistency.`;
    return `⚠️ ${gapDays} days without mood tracking. Your mental state deserves attention.`;
  })();

  // Comeback plan when gap >= 7 days
  const comebackPlan = gapDays !== null && gapDays >= 7
    ? {
        phase: gapDays >= 30 ? "restart" : "rebuild",
        targetEntries: gapDays >= 30 ? 3 : 7,
        targetDays: gapDays >= 30 ? 14 : 7,
        focus: gapDays >= 30
          ? "Rebuild the habit — log 7 days of mood/energy, even rough estimates count."
          : "Get back on track — log how you're feeling right now + aim for daily check-ins.",
        tip: avgMood
          ? `Your historical mood average is ${avgMood}/10. Energy averages ${avgEnergy}/10.`
          : "Start by estimating today's mood and energy — 5 is neutral, 10 is great.",
      }
    : null;

  // This month entries
  const thisMonth = today.toISOString().slice(0, 7);
  const monthEntries = entries.filter((e: any) => e.date.startsWith(thisMonth));

  // Last mood value
  const lastMood = lastEntry?.mood || null;
  const lastEnergy = lastEntry?.energy || null;

  return NextResponse.json({
    lastEntry: lastEntryDate,
    lastMood,
    lastEnergy,
    gapDays,
    avgMood,
    avgEnergy,
    avgLast7Mood,
    totalEntries: entries.length,
    moodStreak,
    energyStreak,
    loggedToday: lastEntry?.date === todayStr,
    thisMonthEntries: monthEntries.length,
    motivation,
    comebackPlan,
    status,
  });
}
