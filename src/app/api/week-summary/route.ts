import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

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

  const habitsMap = habitsRaw?.habits || {};
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

  const summary = days.map((day) => {
    const dayHabits = habitsMap[day] || {};
    const habitCount = Object.keys(dayHabits).filter(k => dayHabits[k]).length;
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
      gym: gymLogs.includes(day),
      water: waterEntry?.glasses || 0,
      sleep: sleepEntry ? { hours: sleepEntry.duration, quality: sleepEntry.quality } : null,
      mood: moodEntry ? { energy: moodEntry.energy, mood: moodEntry.mood, note: moodEntry.note } : null,
      nutrition: { calories: mealsDay.reduce((s: number, m: any) => s + (m.calories || 0), 0), protein: mealsDay.reduce((s: number, m: any) => s + (m.protein || 0), 0) },
      weight: weightEntry?.weight || null,
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
      else break;
    }
    return streak;
  })();

  const lastWeight = weightEntries[weightEntries.length - 1];
  const prevWeight = weightEntries.length >= 2 ? weightEntries[weightEntries.length - 2] : null;
  const weightChange = lastWeight && prevWeight ? lastWeight.weight - prevWeight.weight : null;

  return NextResponse.json({
    days: summary,
    streaks: { gym: gymStreak },
    trends: { weightChange, lastWeight: lastWeight?.weight || null },
    generatedAt: now.toISOString(),
  });
}
