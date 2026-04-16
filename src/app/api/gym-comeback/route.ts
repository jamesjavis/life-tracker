import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GYM_FILE = path.join(process.cwd(), "data", "gym.json");
const HABITS_FILE = path.join(process.cwd(), "data", "habits.json");

function readGym() {
  if (!fs.existsSync(GYM_FILE)) return { logs: [], workouts: {} };
  return JSON.parse(fs.readFileSync(GYM_FILE, "utf-8"));
}

function readHabits() {
  if (!fs.existsSync(HABITS_FILE)) return { habits: {} };
  return JSON.parse(fs.readFileSync(HABITS_FILE, "utf-8"));
}

function averageGap(logs: string[]): number {
  if (logs.length < 2) return 5;
  const sorted = [...logs].sort();
  let total = 0;
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1]);
    const b = new Date(sorted[i]);
    total += (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
  }
  return Math.round(total / (sorted.length - 1));
}

export async function GET() {
  const gym = readGym();
  const habits = readHabits();
  const logs: string[] = gym.logs || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const lastSession = logs.length > 0 ? [...logs].sort().pop()! : null;
  const gapDays = lastSession
    ? Math.round((today.getTime() - new Date(lastSession).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const avgGap = averageGap(logs);
  const totalSessions = logs.length;

  const thisWeekHabits = habits.habits?.[todayStr] || {};
  const gymDoneToday = Boolean(thisWeekHabits.gym);

  const streak = (() => {
    let s = 0;
    let check = new Date(today);
    // Count consecutive gym days starting today
    while (logs.includes(check.toISOString().split("T")[0])) { s++; check.setDate(check.getDate() - 1); }
    // If no gym today, check if yesterday started a streak
    if (s === 0) {
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      check = new Date(yesterday);
      while (logs.includes(check.toISOString().split("T")[0])) { s++; check.setDate(check.getDate() - 1); }
    }
    return s;
  })();

  const longestStreak = (() => {
    if (logs.length === 0) return 0;
    const sorted = [...logs].sort();
    let best = 1, current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i-1]).getTime()) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) { current++; best = Math.max(best, current); }
      else current = 1;
    }
    return best;
  })();

  const thisMonth = today.toISOString().slice(0, 7);
  const monthLogs = logs.filter(l => l.startsWith(thisMonth));
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);
  const lastMonthLogs = logs.filter(l => l.startsWith(lastMonth));

  const motivation = streak > 0
    ? `🔥 ${streak}-day streak! Keep it going.`
    : gapDays !== null && gapDays >= 5
    ? `🏋️ ${gapDays} days since last session. Comeback plan ready — let's go!`
    : `💪 Last session ${gapDays} days ago. You're due soon.`;

  const comebackPlan = gapDays !== null && gapDays >= 4
    ? {
        phase: gapDays >= 14 ? "restart" : "rebuild",
        targetSessions: gapDays >= 14 ? 2 : 3,
        targetWeeks: gapDays >= 14 ? 3 : 2,
        focus: gapDays >= 14
          ? "Light start — full body, lower weight, rebuild the habit first."
          : "Build momentum — aim for your usual ~5 day rhythm.",
        tip: `Your average is every ${avgGap} days across ${totalSessions} total sessions.`,
      }
    : null;

  return NextResponse.json({
    lastSession,
    gapDays,
    avgGapDays: avgGap,
    totalSessions,
    currentStreak: streak,
    longestStreak,
    gymDoneToday,
    thisMonthSessions: monthLogs.length,
    lastMonthSessions: lastMonthLogs.length,
    motivation,
    comebackPlan,
    status: streak > 0 ? "active" : gapDays !== null && gapDays >= 5 ? "comeback_needed" : "on_track",
  });
}
