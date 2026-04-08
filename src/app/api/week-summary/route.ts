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

  // Generate last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
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

  // Aggregate each day
  const summary = days.map((day) => {
    const dayHabits = habitsMap[day] || {};
    const habitCount = Object.keys(dayHabits).filter(k => dayHabits[k]).length;
    const totalHabits = 8; // HABITS.length in page.tsx

    const gymDone = gymLogs.includes(day);

    const waterEntry = (waterEntries as any[]).find((e: any) => e.date === day);
    const waterGlasses = waterEntry?.glasses || 0;

    const sleepEntry = (sleepEntries as any[]).find((e: any) => e.date === day);
    const moodEntry = (moodEntries as any[]).find((e: any) => e.date === day);
    const mealsDay = (mealEntries as any[]).filter((e: any) => e.date === day);
    const weightEntry = (weightEntries as any[]).find((e: any) => e.date === day);

    const totalCalories = mealsDay.reduce((s: number, m: any) => s + (m.calories || 0), 0);
    const totalProtein = mealsDay.reduce((s: number, m: any) => s + (m.protein || 0), 0);

    return {
      date: day,
      dayName: new Date(day + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short" }),
      habits: { done: habitCount, total: totalHabits, pct: Math.round((habitCount / totalHabits) * 100) },
      gym: gymDone,
      water: waterGlasses,
      sleep: sleepEntry ? { hours: sleepEntry.duration, quality: sleepEntry.quality } : null,
      mood: moodEntry ? { energy: moodEntry.energy, mood: moodEntry.mood, note: moodEntry.note } : null,
      nutrition: { calories: totalCalories, protein: totalProtein },
      weight: weightEntry?.weight || null,
    };
  });

  // Gym streak: consecutive days from today going backwards
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