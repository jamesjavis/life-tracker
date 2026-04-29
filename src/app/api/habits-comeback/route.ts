import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const HABIT_IDS = ["yoga", "meditation", "gym", "bauchworkout", "lesen", "creatin", "pushups", "atem", "smoothie"];

export async function GET() {
  const habitsRaw = (await storage.get("habits")) ?? { entries: [] };
  // habits.json new format: entries: [{date, completed:[ids], total}]
  const entries = habitsRaw.entries || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Build date → Set(completedIds) map from entries[]
  const habitsMap: Record<string, Set<string>> = {};
  for (const e of entries) {
    habitsMap[e.date] = new Set(e.completed || []);
  }

  const allDates = Object.keys(habitsMap).sort().reverse();
  const lastEntryDate = allDates[0] || null;
  const gapDays = lastEntryDate ? Math.round((today.getTime() - new Date(lastEntryDate).getTime()) / 86400000) : null;

  const last30Days: any[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayHabits = habitsMap[dateStr] || new Set();
    const completed = [...dayHabits].filter(id => HABIT_IDS.includes(id)).length;
    last30Days.push({ date: dateStr, completed, total: HABIT_IDS.length, hasData: dayHabits.size > 0 });
  }
  const activeDays = last30Days.filter(d => d.hasData && d.completed > 0);
  const completionRate = activeDays.length > 0 ? Math.round(activeDays.reduce((s, d) => s + d.completed / d.total, 0) / activeDays.length * 100) : 0;
  const avgPerDay = activeDays.length > 0 ? Math.round(activeDays.reduce((s, d) => s + d.completed, 0) / activeDays.length * 10) / 10 : 0;

  let currentStreak = 0;
  for (let i = 0; i < 365; i++) { const d = new Date(today); d.setDate(d.getDate() - i); const dateStr = d.toISOString().split("T")[0]; if (habitsMap[dateStr] && habitsMap[dateStr].size > 0) { currentStreak++; } else break; }

  const longestStreak = (() => { const sorted = allDates; if (!sorted.length) return 0; let best = 1, current = 1; for (let i = 1; i < sorted.length; i++) { const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i-1]).getTime()) / 86400000; if (Math.round(diff) === 1) { current++; best = Math.max(best, current); } else current = 1; } return best; })();

  const thisWeekDays = [];
  for (let i = 0; i < 7; i++) { const d = new Date(today); d.setDate(d.getDate() - i); const dateStr = d.toISOString().split("T")[0]; const dayHabits = habitsMap[dateStr] || new Set(); thisWeekDays.push({ date: dateStr, completed: [...dayHabits].filter(id => HABIT_IDS.includes(id)).length, total: HABIT_IDS.length }); }
  const thisWeekAvg = Math.round(thisWeekDays.reduce((s, d) => s + d.completed, 0) / 7 * 10) / 10;

  const status = gapDays === null ? "no_data" : gapDays === 0 ? "logged_today" : gapDays <= 2 ? "recent" : gapDays <= 7 ? "stale" : "comeback_needed";
  const motivation = gapDays === null ? "No habits data yet — start small, build momentum." : gapDays === 0 ? `✅ ${currentStreak}-day streak! You're building something real.` : gapDays === 1 ? "😤 1 day gap — don't let it become 2. Log something now." : gapDays <= 3 ? `⚡ ${gapDays} days gap. A quick habit session resets the streak.` : gapDays <= 7 ? `📊 ${gapDays} days without logging habits. Consistency is the compound interest.` : `⚠️ ${gapDays} days gap. You've done it before — the comeback is shorter than you think.`;

  const comebackPlan = gapDays !== null && gapDays >= 7 ? { phase: gapDays >= 30 ? "restart" : "rebuild", targetDays: gapDays >= 30 ? 14 : 7, focus: gapDays >= 30 ? "Restart with 3 core habits: Push-ups, Meditation, and one you choose. Build from there." : `Rebuild the streak — aim for ${Math.max(1, Math.round(avgPerDay))}+ habits/day. Even 3/9 counts.`, tip: `Your average is ${avgPerDay}/9 habits on active days. Best streak: ${longestStreak} days.` } : null;

  const thisMonth = today.toISOString().split("T")[0].slice(0, 7);
  const monthActiveDays = entries.filter((e: any) => e.date.startsWith(thisMonth) && (e.completed || []).length > 0).length;
  const todayHabits = habitsMap[todayStr] || new Set();
  const todayCompleted = [...todayHabits].filter(id => HABIT_IDS.includes(id)).length;

  return NextResponse.json({ lastEntry: lastEntryDate, gapDays, completionRate, avgPerDay, currentStreak, longestStreak, thisWeekAvg, totalActiveDays: activeDays.length, thisMonthActiveDays: monthActiveDays, todayCompleted, todayTotal: HABIT_IDS.length, loggedToday: todayCompleted > 0, motivation, comebackPlan, status });
}
