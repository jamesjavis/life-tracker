import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function readJson(filename: string) {
  const file = path.join(process.cwd(), "data", filename);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch { return null; }
}

export async function GET() {
  const now = new Date();

  // Generate last 30 days
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  // Habits
  const habitsRaw = readJson("habits.json");
  const habitsMap = habitsRaw?.habits || {};

  // Gym logs
  const gymRaw = readJson("gym.json");
  const gymLogs: string[] = gymRaw?.logs || [];

  // Water
  const waterRaw = readJson("water.json");
  const waterEntries = waterRaw?.entries || [];

  // Sleep
  const sleepRaw = readJson("sleep.json");
  const sleepEntries = sleepRaw?.entries || [];

  // Mood
  const moodRaw = readJson("mood.json");
  const moodEntries = moodRaw?.entries || [];

  // Nutrition
  const mealsRaw = readJson("meals.json");
  const mealEntries = mealsRaw?.entries || [];

  // Weight
  const weightRaw = readJson("weight.json");
  const weightEntries = weightRaw?.entries || [];

  // Breathing
  const breathingRaw = readJson("breathing.json");
  const breathingSessions = breathingRaw?.sessions || [];

  const TOTAL_HABITS = 9;

  const dailyData = days.map((day) => {
    const dayHabits = habitsMap[day] || {};
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
      nutrition: {
        calories: mealsDay.reduce((s: number, m: any) => s + (m.calories || 0), 0),
        protein: mealsDay.reduce((s: number, m: any) => s + (m.protein || 0), 0),
      },
      weight: weightEntry?.weight || null,
      breathing: breathingDay.length > 0 ? breathingDay.reduce((s: number, b: any) => s + (b.minutes || 0), 0) : 0,
    };
  });

  // Streaks
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
      const dayHabits = habitsMap[dayStr] || {};
      const done = Object.keys(dayHabits).filter(k => dayHabits[k]).length;
      if (done >= 5) streak++;
      else if (i > 0) break;
    }
    return streak;
  })();

  // Weekly aggregates (last 4 weeks)
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

  // Trends (comparing last 7 days vs previous 7 days)
  const last7 = dailyData.slice(-7);
  const prev7 = dailyData.slice(-14, -7);

  const trend = (last: number, prev: number): number => {
    if (prev === 0) return last > 0 ? 1 : 0;
    return Math.round(((last - prev) / prev) * 100);
  };

  const gymTrend = trend(last7.filter(d => d.gym).length, prev7.filter(d => d.gym).length);
  const habitTrend = trend(last7.reduce((s, d) => s + d.habits.pct, 0) / 7, prev7.reduce((s, d) => s + d.habits.pct, 0) / 7);
  const moodTrend = trend(
    last7.filter(d => d.mood).reduce((s, d) => s + (d.mood?.mood || 0), 0) / (last7.filter(d => d.mood).length || 1),
    prev7.filter(d => d.mood).reduce((s, d) => s + (d.mood?.mood || 0), 0) / (prev7.filter(d => d.mood).length || 1)
  );
  const sleepTrend = trend(
    last7.filter(d => d.sleep).reduce((s, d) => s + (d.sleep?.hours || 0), 0) / (last7.filter(d => d.sleep).length || 1),
    prev7.filter(d => d.sleep).reduce((s, d) => s + (d.sleep?.hours || 0), 0) / (prev7.filter(d => d.sleep).length || 1)
  );
  const calorieTrend = trend(last7.reduce((s, d) => s + d.nutrition.calories, 0), prev7.reduce((s, d) => s + d.nutrition.calories, 0));
  const weightTrend = (() => {
    const lastWeight = last7.filter(d => d.weight !== null).pop();
    const prevWeight = prev7.filter(d => d.weight !== null).pop();
    if (!lastWeight || !prevWeight) return null;
    return Math.round((lastWeight.weight! - prevWeight.weight!) * 10) / 10;
  })();

  const proteinTrend = trend(
    last7.reduce((s, d) => s + d.nutrition.protein, 0) / 7,
    prev7.reduce((s, d) => s + d.nutrition.protein, 0) / 7
  );

  const waterTrend = trend(
    last7.reduce((s, d) => s + d.water, 0) / 7,
    prev7.reduce((s, d) => s + d.water, 0) / 7
  );
  const breathingTrend = trend(
    last7.reduce((s, d) => s + d.breathing, 0) / 7,
    prev7.reduce((s, d) => s + d.breathing, 0) / 7
  );

  return NextResponse.json({
    days: dailyData,
    weeks,
    streaks: { gym: gymStreak, habit: habitStreak },
    trends: {
      gym: { value: last7.filter(d => d.gym).length, change: gymTrend },
      habits: { value: Math.round(last7.reduce((s, d) => s + d.habits.pct, 0) / 7), change: habitTrend },
      mood: { value: Math.round(last7.filter(d => d.mood).reduce((s, d) => s + (d.mood?.mood || 0), 0) / (last7.filter(d => d.mood).length || 1)), change: moodTrend },
      sleep: { value: Math.round((last7.filter(d => d.sleep).reduce((s, d) => s + (d.sleep?.hours || 0), 0) / (last7.filter(d => d.sleep).length || 1)) * 10) / 10, change: sleepTrend },
      calories: { value: last7.reduce((s, d) => s + d.nutrition.calories, 0), change: calorieTrend },
      weight: { value: last7.filter(d => d.weight !== null).pop()?.weight || null, change: weightTrend },
      water: { value: Math.round(last7.reduce((s, d) => s + d.water, 0) / 7), change: waterTrend },
      protein: { value: Math.round(last7.reduce((s, d) => s + d.nutrition.protein, 0) / 7), change: proteinTrend },
      breathing: { value: Math.round(last7.reduce((s, d) => s + d.breathing, 0) / 7), change: breathingTrend },
    },
    generatedAt: now.toISOString(),
  });
}
