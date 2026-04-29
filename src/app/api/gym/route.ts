import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { berlinNow, berlinDateStr, berlinDateFromStr } from "@/lib/date";

const DEFAULT_DATA = { logs: [], streak: 0, workouts: {} };

function calculateStreak(logs: string[]): number {
  if (!logs.length) return 0;
  const todayStr = berlinDateStr();
  const yesterday = new Date(berlinNow());
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const sorted = [...logs].sort();
  const lastLog = sorted[sorted.length - 1];
  if (lastLog !== todayStr && lastLog !== yesterdayStr) return 0;
  let streak = 0;
  let currentDate = berlinDateFromStr(lastLog);
  while (logs.includes(currentDate.toISOString().split("T")[0])) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }
  return streak;
}

// GET /api/gym - Get gym data
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const data = (await storage.get("gym")) ?? DEFAULT_DATA;
  data.streak = calculateStreak(data.logs);

  const now = berlinNow();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const weeklyFreq: Record<string, number> = {};
  const monthlyCount = { this: 0, last: 0 };
  const totalSessions = data.logs.length;

  data.logs.forEach((log: string) => {
    const d = new Date(log);
    const year = d.getFullYear();
    const week = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
    const yw = `${year}-W${week.toString().padStart(2, '0')}`;
    weeklyFreq[yw] = (weeklyFreq[yw] || 0) + 1;
    if (d >= thisMonthStart) monthlyCount.this++;
    else {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      if (d >= lastMonthStart) monthlyCount.last++;
    }
  });

  const last8Weeks = Object.entries(weeklyFreq)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 8)
    .map(([week, count]) => ({ week, count }));

  const sortedLogs = [...data.logs].sort();
  let avgGap = 0;
  if (sortedLogs.length >= 2) {
    let total = 0;
    for (let i = 1; i < sortedLogs.length; i++) {
      total += (new Date(sortedLogs[i]).getTime() - new Date(sortedLogs[i-1]).getTime()) / 86400000;
    }
    avgGap = Math.round(total / (sortedLogs.length - 1));
  }

  const thisWeekLogs = data.logs.filter((log: string) => new Date(log) >= thisWeekStart);
  const stats = {
    totalSessions,
    thisWeekSessions: thisWeekLogs.length,
    monthlyThis: monthlyCount.this,
    monthlyLast: monthlyCount.last,
    avgGapDays: avgGap,
    last8Weeks,
    weeklyAverage: totalSessions > 0
      ? parseFloat((totalSessions / Math.max(1, (new Date(sortedLogs[0]).getTime() > 0 ? (now.getTime() - new Date(sortedLogs[0]).getTime()) / (1000 * 60 * 60 * 24 * 7) : 1))).toFixed(1))
      : 0,
  };

  if (date) {
    const workout = data.workouts?.[date];
    return NextResponse.json({ logs: data.logs, streak: data.streak, workout: workout || null, stats });
  }
  return NextResponse.json({ logs: data.logs, streak: data.streak, workouts: data.workouts || {}, stats });
}

// POST /api/gym - Log gym session
export async function POST(req: Request) {
  const body = await req.json();
  const { date, completed, workout } = body;
  const data = (await storage.get("gym")) ?? DEFAULT_DATA;
  const dateStr = date || berlinDateStr();

  if (completed === false) {
    data.logs = data.logs.filter((l: string) => l !== dateStr);
    delete data.workouts?.[dateStr];
    data.streak = calculateStreak(data.logs);
    await storage.set("gym", data);
    return NextResponse.json({ success: true, streak: data.streak });
  }

  if (!data.logs.includes(dateStr)) {
    data.logs.push(dateStr);
    data.logs.sort();
    data.streak = calculateStreak(data.logs);
  }
  if (workout) {
    if (!data.workouts) data.workouts = {};
    data.workouts[dateStr] = { ...workout, timestamp: new Date().toISOString() };
  }
  await storage.set("gym", data);
  return NextResponse.json({ success: true, streak: data.streak });
}
