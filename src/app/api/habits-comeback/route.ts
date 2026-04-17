import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const HABITS_FILE = path.join(process.cwd(), "data", "habits.json");

const HABIT_IDS = [
  "yoga", "meditation", "gym", "bauchworkout",
  "lesen", "creatin", "pushups", "atem", "smoothie"
];

function readHabits() {
  if (!fs.existsSync(HABITS_FILE)) return { habits: {} };
  return JSON.parse(fs.readFileSync(HABITS_FILE, "utf-8"));
}

export async function GET() {
  const habitsData = readHabits();
  const habits = habitsData.habits || {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Find the last date with at least one habit logged (non-empty object)
  const allDates = Object.keys(habits).filter(d => {
    const dayHabits = habits[d];
    return dayHabits && Object.values(dayHabits).some(v => v === true);
  }).sort().reverse();

  const lastEntryDate = allDates[0] || null;

  const gapDays = lastEntryDate
    ? Math.round((today.getTime() - new Date(lastEntryDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Calculate completion rate over last 30 days
  const last30Days: { date: string; completed: number; total: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayHabits = habits[dateStr] || {};
    const completed = HABIT_IDS.filter(id => dayHabits[id] === true).length;
    const total = HABIT_IDS.length;
    // Only include days with actual data (not all 0 from empty {})
    const hasData = Object.values(dayHabits).some(v => v === true) || completed === 0;
    last30Days.push({ date: dateStr, completed, total, hasData });
  }

  // Days with at least one habit logged
  const activeDays = last30Days.filter(d => d.hasData && d.completed > 0);
  const completionRate = activeDays.length > 0
    ? Math.round(activeDays.reduce((s, d) => s + d.completed / d.total, 0) / activeDays.length * 100)
    : 0;

  // Average habits per active day
  const avgPerDay = activeDays.length > 0
    ? Math.round(activeDays.reduce((s, d) => s + d.completed, 0) / activeDays.length * 10) / 10
    : 0;

  // Current streak: consecutive days ending today with at least 1 habit
  const currentStreak = (() => {
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayHabits = habits[dateStr] || {};
      const completed = HABIT_IDS.filter(id => dayHabits[id] === true).length;
      if (completed > 0) s++;
      else break;
    }
    return s;
  })();

  // Longest streak ever
  const longestStreak = (() => {
    const sortedDates = Object.keys(habits)
      .filter(d => Object.values(habits[d] || {}).some(v => v === true))
      .sort();
    if (sortedDates.length === 0) return 0;
    let best = 1, current = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const diff = (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i-1]).getTime()) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) { current++; best = Math.max(best, current); }
      else current = 1;
    }
    return best;
  })();

  // This week completion
  const thisWeekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayHabits = habits[dateStr] || {};
    const completed = HABIT_IDS.filter(id => dayHabits[id] === true).length;
    thisWeekDays.push({ date: dateStr, completed, total: HABIT_IDS.length });
  }
  const thisWeekAvg = Math.round(thisWeekDays.reduce((s, d) => s + d.completed, 0) / 7 * 10) / 10;

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
    if (gapDays === null) return "No habits data yet — start small, build momentum.";
    if (gapDays === 0) return `✅ ${currentStreak}-day streak! You're building something real.`;
    if (gapDays === 1) return "😤 1 day gap — don't let it become 2. Log something now.";
    if (gapDays <= 3) return `⚡ ${gapDays} days gap. A quick habit session resets the streak.`;
    if (gapDays <= 7) return `📊 ${gapDays} days without logging habits. Consistency is the compound interest.`;
    return `⚠️ ${gapDays} days gap. You've done it before — the comeback is shorter than you think.`;
  })();

  // Comeback plan when gap >= 7 days
  const comebackPlan = gapDays !== null && gapDays >= 7
    ? {
        phase: gapDays >= 30 ? "restart" : "rebuild",
        targetDays: gapDays >= 30 ? 14 : 7,
        focus: gapDays >= 30
          ? "Restart with 3 core habits: Push-ups, Meditation, and one you choose. Build from there."
          : `Rebuild the streak — aim for ${Math.max(1, Math.round(avgPerDay))}+ habits/day. Even 3/9 counts.`,
        tip: `Your average is ${avgPerDay}/9 habits on active days. Best streak: ${longestStreak} days.`,
      }
    : null;

  // This month active days
  const thisMonth = today.toISOString().slice(0, 7);
  const monthActiveDays = Object.keys(habits).filter(d =>
    d.startsWith(thisMonth) && Object.values(habits[d] || {}).some(v => v === true)
  ).length;

  // Today status
  const todayHabits = habits[todayStr] || {};
  const todayCompleted = HABIT_IDS.filter(id => todayHabits[id] === true).length;
  const loggedToday = todayCompleted > 0;

  return NextResponse.json({
    lastEntry: lastEntryDate,
    gapDays,
    completionRate,
    avgPerDay,
    currentStreak,
    longestStreak,
    thisWeekAvg,
    totalActiveDays: activeDays.length,
    thisMonthActiveDays: monthActiveDays,
    todayCompleted,
    todayTotal: HABIT_IDS.length,
    loggedToday,
    motivation,
    comebackPlan,
    status,
  });
}
