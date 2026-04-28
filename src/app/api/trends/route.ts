import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  const now = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  // Parallel reads
  const [habitsRaw, gymRaw, waterRaw, sleepRaw, moodRaw, mealsRaw, weightRaw, breathingRaw, pushupsRaw] =
    await Promise.all([
      storage.get("habits"),
      storage.get("gym"),
      storage.get("water"),
      storage.get("sleep"),
      storage.get("mood"),
      storage.get("meals"),
      storage.get("weight"),
      storage.get("breathing"),
      storage.get("pushups"),
    ]);

  const habitsEntries = habitsRaw?.entries || [];
  const habitsMap: Record<string, Set<string>> = {};
  for (const e of habitsEntries) {
    habitsMap[e.date] = new Set(e.completed || []);
  }
  const gymLogs: string[] = gymRaw?.logs || [];
  const waterEntries = waterRaw?.entries || [];
  const sleepEntries = sleepRaw?.entries || [];
  const moodEntries = moodRaw?.entries || [];
  const mealEntries = mealsRaw?.entries || [];
  const weightEntries = weightRaw?.entries || [];
  const breathingSessions = breathingRaw?.sessions || [];
  const pushupEntries = pushupsRaw?.entries || [];
  const pushupSet = new Set(pushupEntries.map((e: any) => e.date));
  const TOTAL_HABITS = 9;

  const dailyData = days.map((day) => {
    const dayHabits = habitsMap[day] ? Object.fromEntries([...habitsMap[day]].map(id => [id, true])) : {};
    const habitCount = Object.keys(dayHabits).filter(k => dayHabits[k]).length;
    const gymDone = gymLogs.includes(day);
    const waterEntry = (waterEntries as any[]).find((e: any) => e.date === day);
    const sleepEntry = (sleepEntries as any[]).find((e: any) => e.date === day);
    const moodEntry = (moodEntries as any[]).find((e: any) => e.date === day);
    const mealsDay = (mealEntries as any[]).filter((e: any) => e.date === day);
    const weightEntry = (weightEntries as any[]).find((e: any) => e.date === day);
    const breathingDay = (breathingSessions as any[]).filter((s: any) => s.date === day);
    return {
      date: day,
      dayName: new Date(day + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short" }),
      habits: { done: habitCount, total: TOTAL_HABITS, pct: Math.round((habitCount / TOTAL_HABITS) * 100) },
      gym: gymDone,
      water: waterEntry?.glasses || 0,
      sleep: sleepEntry ? { hours: sleepEntry.duration, quality: sleepEntry.quality } : null,
      mood: moodEntry ? { energy: moodEntry.energy, mood: moodEntry.mood } : null,
      nutrition: { calories: mealsDay.reduce((s: number, m: any) => s + (m.calories || 0), 0), protein: mealsDay.reduce((s: number, m: any) => s + (m.protein || 0), 0) },
      weight: weightEntry?.weight || null,
      // FIX: breathing stores duration in SECONDS (from breathing route), convert to minutes
      breathing: breathingDay.length > 0 ? Math.round(breathingDay.reduce((s: number, b: any) => s + ((b.duration || 0) / 60), 0)) : 0,
      pushups: pushupSet.has(day) ? 1 : 0,
    };
  });

  const gymStreak = (() => {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      if (gymLogs.includes(dayStr)) streak++;
      else if (i > 0) break;
    }
    return streak;
  })();

  const habitStreak = (() => {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const dayHabits = habitsMap[dayStr] ? Object.fromEntries([...habitsMap[dayStr]].map(id => [id, true])) : {};
      const done = Object.keys(dayHabits).filter(k => dayHabits[k]).length;
      if (done >= 5) streak++;
      else if (i > 0) break;
    }
    return streak;
  })();

  const weeks = Array.from({ length: 4 }, (_, wi) => {
    const start = wi * 7;
    const weekDays = dailyData.slice(start, start + 7);
    const gymDays = weekDays.filter(d => d.gym).length;
    const avgHabitPct = Math.round(weekDays.reduce((s, d) => s + d.habits.pct, 0) / (weekDays.length || 1));
    const avgMood = Math.round(weekDays.filter(d => d.mood).reduce((s, d) => s + (d.mood?.mood || 0), 0) / (weekDays.filter(d => d.mood).length || 1));
    const avgSleep = Math.round((weekDays.filter(d => d.sleep).reduce((s, d) => s + (d.sleep?.hours || 0), 0) / (weekDays.filter(d => d.sleep).length || 1)) * 10) / 10;
    const totalCalories = weekDays.reduce((s, d) => s + d.nutrition.calories, 0);
    const totalProtein = weekDays.reduce((s, d) => s + d.nutrition.protein, 0);
    return { week: wi + 1, gymDays, avgHabitPct, avgMood, avgSleep, totalCalories, totalProtein };
  });

  const last7 = dailyData.slice(-7);
  const prev7 = dailyData.slice(-14, -7);
  const trend = (last: number, prev: number): number => {
    if (prev === 0) return last > 0 ? 1 : 0;
    return Math.round(((last - prev) / prev) * 100);
  };

  return NextResponse.json({
    days: dailyData,
    weeks,
    streaks: { gym: gymStreak, habit: habitStreak },
    trends: {
      gym: { value: last7.filter(d => d.gym).length, change: trend(last7.filter(d => d.gym).length, prev7.filter(d => d.gym).length) },
      habits: { value: Math.round(last7.reduce((s, d) => s + d.habits.pct, 0) / 7), change: trend(Math.round(last7.reduce((s, d) => s + d.habits.pct, 0) / 7), Math.round(prev7.reduce((s, d) => s + d.habits.pct, 0) / 7)) },
      mood: { value: Math.round(last7.filter(d => d.mood).reduce((s, d) => s + (d.mood?.mood || 0), 0) / (last7.filter(d => d.mood).length || 1)), change: trend(Math.round(last7.filter(d => d.mood).reduce((s, d) => s + (d.mood?.mood || 0), 0) / (last7.filter(d => d.mood).length || 1)), Math.round(prev7.filter(d => d.mood).reduce((s, d) => s + (d.mood?.mood || 0), 0) / (prev7.filter(d => d.mood).length || 1))) },
      sleep: { value: Math.round((last7.filter(d => d.sleep).reduce((s, d) => s + (d.sleep?.hours || 0), 0) / (last7.filter(d => d.sleep).length || 1)) * 10) / 10, change: trend(Math.round((last7.filter(d => d.sleep).reduce((s, d) => s + (d.sleep?.hours || 0), 0) / (last7.filter(d => d.sleep).length || 1)) * 10) / 10, Math.round((prev7.filter(d => d.sleep).reduce((s, d) => s + (d.sleep?.hours || 0), 0) / (prev7.filter(d => d.sleep).length || 1)) * 10) / 10) },
      calories: { value: last7.reduce((s, d) => s + d.nutrition.calories, 0), change: trend(last7.reduce((s, d) => s + d.nutrition.calories, 0), prev7.reduce((s, d) => s + d.nutrition.calories, 0)) },
      weight: { value: last7.filter(d => d.weight !== null).pop()?.weight || null, change: (() => { const lw = last7.filter(d => d.weight !== null).pop(); const pw = prev7.filter(d => d.weight !== null).pop(); if (!lw || !pw) return null; return Math.round((lw.weight! - pw.weight!) * 10) / 10; })() },
      water: { value: Math.round(last7.reduce((s, d) => s + d.water, 0) / 7), change: trend(Math.round(last7.reduce((s, d) => s + d.water, 0) / 7), Math.round(prev7.reduce((s, d) => s + d.water, 0) / 7)) },
      protein: { value: Math.round(last7.reduce((s, d) => s + d.nutrition.protein, 0) / 7), change: trend(Math.round(last7.reduce((s, d) => s + d.nutrition.protein, 0) / 7), Math.round(prev7.reduce((s, d) => s + d.nutrition.protein, 0) / 7)) },
      // FIX: trends.breathing now correctly shows minutes (avg/day) from converted seconds data
      breathing: { value: Math.round(last7.reduce((s, d) => s + d.breathing, 0) / 7), change: trend(Math.round(last7.reduce((s, d) => s + d.breathing, 0) / 7), Math.round(prev7.reduce((s, d) => s + d.breathing, 0) / 7)) },
      pushups: { value: last7.reduce((s, d) => s + d.pushups, 0), change: trend(last7.reduce((s, d) => s + d.pushups, 0), prev7.reduce((s, d) => s + d.pushups, 0)) },
      energy: { value: Math.round(last7.filter(d => d.mood).reduce((s, d) => s + (d.mood?.energy || 0), 0) / (last7.filter(d => d.mood).length || 1)), change: trend(Math.round(last7.filter(d => d.mood).reduce((s, d) => s + (d.mood?.energy || 0), 0) / (last7.filter(d => d.mood).length || 1)), Math.round(prev7.filter(d => d.mood).reduce((s, d) => s + (d.mood?.energy || 0), 0) / (prev7.filter(d => d.mood).length || 1))) },
    },
    generatedAt: now.toISOString(),
  });
}