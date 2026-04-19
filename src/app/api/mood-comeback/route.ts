import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  const mood = (await storage.get("mood")) ?? { entries: [] };
  const entries = mood.entries || [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const sorted = [...entries].sort((a: any, b: any) => b.date.localeCompare(a.date));
  const lastEntry = sorted[0] || null;
  const lastEntryDate = lastEntry?.date || null;
  const gapDays = lastEntryDate ? Math.round((today.getTime() - new Date(lastEntryDate).getTime()) / 86400000) : null;
  const avgMood = entries.length > 0 ? Math.round(entries.reduce((s: number, e: any) => s + (e.mood || 0), 0) / entries.length * 10) / 10 : null;
  const avgEnergy = entries.length > 0 ? Math.round(entries.reduce((s: number, e: any) => s + (e.energy || 0), 0) / entries.length * 10) / 10 : null;
  const MOOD_GOAL = 7;
  let moodStreak = 0; for (const entry of sorted) { if ((entry.mood || 0) >= MOOD_GOAL) moodStreak++; else break; }
  let energyStreak = 0; for (const entry of sorted) { if ((entry.energy || 0) >= MOOD_GOAL) energyStreak++; else break; }
  const last7 = entries.slice(-7);
  const avgLast7Mood = last7.length > 0 ? Math.round(last7.reduce((s: number, e: any) => s + (e.mood || 0), 0) / last7.length * 10) / 10 : null;
  const status = gapDays === null ? "no_data" : gapDays === 0 ? "logged_today" : gapDays <= 2 ? "recent" : gapDays <= 7 ? "stale" : "comeback_needed";
  const motivation = gapDays === null ? "No mood data yet — start tracking how you feel!" : gapDays === 0 ? "✅ Mood logged today — self-awareness is strength." : gapDays === 1 ? "😌 Yesterday's mood logged — keep tracking the pattern." : gapDays <= 3 ? "🌤️ A few days gap — mood patterns are worth tracking." : gapDays <= 7 ? `📊 ${gapDays} days without a mood entry. Patterns emerge with consistency.` : `⚠️ ${gapDays} days without mood tracking. Your mental state deserves attention.`;
  const comebackPlan = gapDays !== null && gapDays >= 7 ? { phase: gapDays >= 30 ? "restart" : "rebuild", targetEntries: gapDays >= 30 ? 3 : 7, targetDays: gapDays >= 30 ? 14 : 7, focus: gapDays >= 30 ? "Rebuild the habit — log 7 days of mood/energy, even rough estimates count." : "Get back on track — log how you're feeling right now + aim for daily check-ins.", tip: avgMood ? `Your historical mood average is ${avgMood}/10. Energy averages ${avgEnergy}/10.` : "Start by estimating today's mood and energy — 5 is neutral, 10 is great." } : null;
  const thisMonth = today.toISOString().slice(0, 7);
  const monthEntries = entries.filter((e: any) => e.date.startsWith(thisMonth));
  return NextResponse.json({ lastEntry: lastEntryDate, lastMood: lastEntry?.mood || null, lastEnergy: lastEntry?.energy || null, gapDays, avgMood, avgEnergy, avgLast7Mood, totalEntries: entries.length, moodStreak, energyStreak, loggedToday: lastEntry?.date === todayStr, thisMonthEntries: monthEntries.length, motivation, comebackPlan, status });
}
