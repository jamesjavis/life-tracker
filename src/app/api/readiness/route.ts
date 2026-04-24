import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const HABIT_IDS = ["yoga", "meditation", "gym", "bauchworkout", "lesen", "creatin", "pushups", "atem", "smoothie"];
const HABIT_WITHOUT_HABITS_FILE = ["pushups"]; // tracked in their own JSON files, not habits.json
const WATER_GOAL = 8;
const SLEEP_GOAL_H = 7;
const SLEEP_GOAL_Q = 7;
const CALORIE_GOAL = 2100;

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const [habitsRaw, waterRaw, sleepRaw, moodRaw, mealsRaw, gymRaw, pushupsRaw, supplementsRaw] = await Promise.all([
    storage.get("habits"),
    storage.get("water"),
    storage.get("sleep"),
    storage.get("mood"),
    storage.get("meals"),
    storage.get("gym"),
    storage.get("pushups"),
    storage.get("supplements"),
  ]);

  // ── Habits (30 pts) ──────────────────────────────────────────────
  const todayHabits = (habitsRaw?.habits?.[today]) || {};
  const pushupsEntries = pushupsRaw?.entries || [];
  const pushupsDoneToday = pushupsEntries.some((e: any) => e.date === today);
  const completedHabits = HABIT_IDS.filter(id => {
    if (HABIT_WITHOUT_HABITS_FILE.includes(id)) {
      if (id === "pushups") return pushupsDoneToday;
    }
    return todayHabits[id];
  }).length;
  const habitsScore = Math.round((completedHabits / HABIT_IDS.length) * 30);

  // ── Water (20 pts) ───────────────────────────────────────────────
  const waterToday = (waterRaw?.entries || []).find((e: any) => e.date === today);
  const waterGlasses = waterToday?.glasses ?? 0;
  const waterScore = Math.round(Math.min(waterGlasses / WATER_GOAL, 1) * 20);

  // ── Sleep (30 pts) ───────────────────────────────────────────────
  const sleepEntries = sleepRaw?.entries || [];
  // sleep: oldest-first [0]=oldest, [length-1]=newest
  const todaySleep = sleepEntries.find((e: any) => e.date === today);
  const lastSleep = sleepEntries[sleepEntries.length - 1];
  const sleepDuration = todaySleep?.duration ?? lastSleep?.duration ?? 0;
  const sleepQuality = todaySleep?.quality ?? lastSleep?.quality ?? 0;
  const sleepDurationScore = sleepDuration >= SLEEP_GOAL_H ? 15 : Math.round((sleepDuration / SLEEP_GOAL_H) * 15);
  const sleepQualityScore = sleepQuality >= SLEEP_GOAL_Q ? 15 : Math.round((sleepQuality / 10) * 15);
  const sleepScore = sleepDurationScore + sleepQualityScore;

  // ── Nutrition (20 pts) ───────────────────────────────────────────
  const mealEntries = mealsRaw?.entries || [];
  const todayMeals = mealEntries.filter((e: any) => e.date === today);
  const todayCalories = todayMeals.reduce((s: number, e: any) => s + (e.calories ?? 0), 0);
  const todayProtein = todayMeals.reduce((s: number, e: any) => s + (e.protein ?? 0), 0);
  const nutritionScore = Math.round(Math.min(todayCalories / CALORIE_GOAL, 1) * 20);

  // ── Gym bonus (0 or bonus pts) ──────────────────────────────────
  const gymLogs = gymRaw?.logs || [];
  const gymToday = gymLogs.includes(today);
  const gymScore = gymToday ? 10 : 0;

  // ── Supplements (12 pts: 6 supplements × 2 pts each) ─────────────
  const supplementsList = supplementsRaw?.supplements || [];
  const supplementsLog = supplementsRaw?.log || [];
  const supplementIds = new Set(supplementsLog.filter((e: any) => e.date === today).map((e: any) => e.supplementId));
  const supplementsTakenToday = supplementsList.filter((s: any) => supplementIds.has(s.id)).length;
  const supplementsScore = Math.round((supplementsTakenToday / Math.max(supplementsList.length, 1)) * 12);

  const total = habitsScore + waterScore + sleepScore + nutritionScore + gymScore + supplementsScore;
  const max = 122; // 100 base + 10 gym bonus + 12 supplements

  // ── Mood / Energy ───────────────────────────────────────────────
  // mood: oldest-first [0]=oldest, [length-1]=newest
  const moodEntries = moodRaw?.entries || [];
  const todayMood = moodEntries.find((e: any) => e.date === today);
  const lastMood = moodEntries[moodEntries.length - 1];
  const energy = todayMood?.energy ?? lastMood?.energy ?? 0;
  const mood = todayMood?.mood ?? lastMood?.mood ?? 0;

  // ── Overall label ────────────────────────────────────────────────
  const pct = Math.round((total / max) * 100);
  const label = pct >= 85 ? "green" : pct >= 65 ? "yellow" : pct >= 40 ? "orange" : "red";

  return NextResponse.json({
    score: total,
    max,
    percentage: pct,
    label,
    breakdown: {
      habits: { score: habitsScore, max: 30, done: completedHabits, total: HABIT_IDS.length },
      water: { score: waterScore, max: 20, glasses: waterGlasses, goal: WATER_GOAL },
      sleep: { score: sleepScore, max: 30, duration: sleepDuration, quality: sleepQuality },
      nutrition: { score: nutritionScore, max: 20, calories: todayCalories, protein: todayProtein },
      gym: { score: gymScore, max: 10, done: gymToday },
      supplements: { score: supplementsScore, max: 12, taken: supplementsTakenToday, total: supplementsList.length },
    },
    mood: { energy, mood },
    today,
  });
}
