import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  const sleep = (await storage.get("sleep")) ?? { entries: [] };
  const entries = sleep.entries || [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const sorted = [...entries].sort((a: any, b: any) => b.date.localeCompare(a.date));
  const lastEntry = sorted[0] || null;
  const lastEntryDate = lastEntry?.date || null;
  const gapDays = lastEntryDate ? Math.round((today.getTime() - new Date(lastEntryDate).getTime()) / 86400000) : null;
  const avgSleep = entries.length > 0 ? Math.round(entries.reduce((s: number, e: any) => s + e.duration, 0) / entries.length * 10) / 10 : null;
  const last7 = entries.slice(-7);
  const avgLast7 = last7.length > 0 ? Math.round(last7.reduce((s: number, e: any) => s + e.duration, 0) / last7.length * 10) / 10 : null;
  let streak = 0; for (const entry of sorted) { if (entry.duration >= 7) streak++; else break; }
  const status = gapDays === null ? "no_data" : gapDays === 0 ? "logged_today" : gapDays <= 2 ? "recent" : gapDays <= 7 ? "stale" : "comeback_needed";
  const motivation = gapDays === null ? "No sleep data yet — start logging!" : gapDays === 0 ? "✅ Sleep logged today — keep it up!" : gapDays === 1 ? "😴 Yesterday's sleep logged — how'd you rest?" : gapDays <= 3 ? "🌙 Last sleep entry was before Easter — time to log again." : gapDays <= 7 ? `📊 ${gapDays} days since last entry. Sleep tracking gap growing.` : `⚠️ ${gapDays} days without sleep data. Your body needs rest tracking.`;
  const comebackPlan = gapDays !== null && gapDays >= 7 ? { phase: gapDays >= 30 ? "restart" : "rebuild", targetEntries: gapDays >= 30 ? 3 : 7, targetDays: gapDays >= 30 ? 14 : 7, focus: gapDays >= 30 ? "Rebuild the habit — log 7 nights, even if rough estimates." : "Get back on track — log last night's sleep and aim for consistent 7-8h.", tip: avgSleep ? `Your historical average is ${avgSleep}h/night. Aim for that consistently.` : "Start by estimating last night's sleep duration and quality." } : null;
  const thisMonth = today.toISOString().slice(0, 7);
  const monthEntries = entries.filter((e: any) => e.date.startsWith(thisMonth));
  return NextResponse.json({ lastEntry: lastEntry?.date || null, lastDuration: lastEntry?.duration || null, lastQuality: lastEntry?.quality || null, gapDays, avgSleep, avgLast7, totalEntries: entries.length, currentStreak: streak, loggedToday: lastEntry?.date === todayStr, thisMonthEntries: monthEntries.length, motivation, comebackPlan, status });
}
