import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const HABIT_IDS = ["yoga", "meditation", "gym", "bauchworkout", "lesen", "creatin", "pushups", "atem", "smoothie"];
const HABIT_WITHOUT_HABITS_FILE = ["pushups"]; // tracked in their own JSON files, not habits.json
const WATER_GOAL = 8;
const SLEEP_GOAL_H = 7;
const SLEEP_GOAL_Q = 7;
const CALORIE_GOAL = 2100;

function berlinDate(): Date {
  return new Date(Date.now() + 2 * 60 * 60 * 1000);
}

export async function GET() {
  const today = berlinDate().toISOString().split("T")[0];

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
  // habits.json: { habits: [{id, name, emoji}], entries: [{date, completed:[ids], total}] }
  const habitsEntries = (habitsRaw?.entries || []);
  const todayEntry = habitsEntries.find((e: any) => e.date === today);
  const completedIds = new Set(todayEntry?.completed || []);
  const pushupsEntries = pushupsRaw?.entries || [];
  const pushupsDoneToday = pushupsEntries.some((e: any) => e.date === today);
  const completedHabits = HABIT_IDS.filter(id => {
    if (id === "pushups") return pushupsDoneToday;
    return completedIds.has(id);
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

  // ── Gym (10 pts, 7-day rolling) ──────────────────────────────────
  // Score based on sessions in the last 7 gym-scheduled days (Mon/Wed/Fri), not just today.
  // This prevents wild readiness swings on non-gym days vs gym days.
  const gymDaysJS = [1, 3, 5]; // Mon=1, Wed=3, Fri=5 (JavaScript getDay)
  const todayDay = berlinDate().getDay();
  const isGymDay = gymDaysJS.includes(todayDay);
  const gymLogs = gymRaw?.logs || [];
  const gymLogsSet = new Set(gymLogs);
  const gymToday = gymLogs.includes(today);

  // Rolling 7 calendar days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(berlinDate());
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  const gymScheduledDaysInLast7 = last7Days.filter(d => gymDaysJS.includes(new Date(d + 'T12:00:00').getDay()));
  const gymSessionsInLast7 = gymScheduledDaysInLast7.filter(d => gymLogsSet.has(d)).length;
  const gymDaysScheduledInLast7 = gymScheduledDaysInLast7.length;
  // Proportional score: 3 gym days in last week = 10pts, 2 = 7pts, 1 = 3pts, 0 = 0pts
  const gymWeeklyScore = gymSessionsInLast7 > 0
    ? Math.round((gymSessionsInLast7 / Math.max(gymDaysScheduledInLast7, 1)) * 10)
    : 0;

  // ── Supplements (12 pts: 6 supplements × 2 pts each) ─────────────
  // Handle two formats: newer "entries" [{date, taken:[ids]}] and legacy "log" [{date, supplementId}]
  const supplementsList = supplementsRaw?.supplements || [];
  const supplementsLog = supplementsRaw?.log || [];
  const supplementsEntries = supplementsRaw?.entries || [];

  // Prefer entries array (newer format), fallback to log array (legacy per-supplement format)
  let supplementIdsToday: Set<string>;
  if (supplementsEntries.length > 0) {
    // entries: [{date, taken:[supplementId, ...]}, ...] — find today's entry
    const todayEntry = supplementsEntries.find((e: any) => e.date === today);
    supplementIdsToday = new Set(todayEntry?.taken || []);
  } else {
    // log: [{date, supplementId}, ...] — filter by today
    supplementIdsToday = new Set(supplementsLog.filter((e: any) => e.date === today).map((e: any) => e.supplementId));
  }
  const supplementsTakenToday = supplementsList.filter((s: any) => supplementIdsToday.has(s.id)).length;
  const supplementsScore = Math.round((supplementsTakenToday / Math.max(supplementsList.length, 1)) * 12);

  const baseMax = 112; // 30 habits + 20 water + 30 sleep + 20 nutrition + 12 supplements
  const max = baseMax + 10; // gym always included (10 pts rolling)
  const total = habitsScore + waterScore + sleepScore + nutritionScore + gymWeeklyScore + supplementsScore;

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

  // ── Weekly Adherence (last 7 days) ───────────────────────────────
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(berlinDate());
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const gymDaysSet = new Set(gymLogs);
  const habitDates = new Set(habitsEntries.map((e: any) => e.date));
  const waterDates = new Set((waterRaw?.entries || []).map((e: any) => e.date));
  const sleepDates = new Set((sleepRaw?.entries || []).map((e: any) => e.date));
  const moodDates = new Set((moodRaw?.entries || []).map((e: any) => e.date));
  // supplements: union of log[] and entries[] dates
  const supplementDatesFromLog = new Set((supplementsRaw?.log || []).map((e: any) => e.date));
  const supplementDatesFromEntries = new Set((supplementsRaw?.entries || []).map((e: any) => e.date));
  const supplementDates = new Set([...supplementDatesFromLog, ...supplementDatesFromEntries]);
  const pushupDates = new Set((pushupsRaw?.entries || []).map((e: any) => e.date));

  const weeklyAdherence = last7.map((day) => {
    const dayOfWeek = new Date(day + 'T12:00:00').getDay();
    const isGymDay = gymDaysJS.includes(dayOfWeek);
    const gymRequired = isGymDay;
    return {
      date: day,
      dayName: new Date(day + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short' }),
      habits: habitDates.has(day),
      gym: gymRequired ? (gymDaysSet.has(day) ? true : null) : undefined, // true=done, null=skipped, undefined=not required
      water: waterDates.has(day),
      sleep: sleepDates.has(day),
      mood: moodDates.has(day),
      supplements: supplementDates.has(day),
      pushups: pushupDates.has(day),
    };
  });

  // Per-metric 7-day adherence percentages
  const adherencePct = (metric: string, required: (d: any) => boolean, logged: (d: any) => boolean | null | undefined) => {
    const days = weeklyAdherence.map(d => ({ ...d, required: required(d), logged: logged(d) }));
    const requiredDays = days.filter(d => d.required !== undefined);
    const loggedRequired = requiredDays.filter(d => d.logged === true || d.logged === undefined).length;
    const nonRequired = days.filter(d => d.required === undefined || d.required === false);
    const loggedNonRequired = nonRequired.filter(d => d.logged === true).length;
    const total = requiredDays.length + nonRequired.length;
    return total > 0 ? Math.round(((loggedRequired + loggedNonRequired) / 7) * 100) : 0;
  };

  const adherence = {
    habits: Math.round((weeklyAdherence.filter(d => d.habits).length / 7) * 100),
    gym: weeklyAdherence.filter(d => d.gym === true).length, // count gym days done
    water: Math.round((weeklyAdherence.filter(d => d.water).length / 7) * 100),
    sleep: Math.round((weeklyAdherence.filter(d => d.sleep).length / 7) * 100),
    mood: Math.round((weeklyAdherence.filter(d => d.mood).length / 7) * 100),
    supplements: Math.round((weeklyAdherence.filter(d => d.supplements).length / 7) * 100),
    pushups: Math.round((weeklyAdherence.filter(d => d.pushups).length / 7) * 100),
  };

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
      gym: { score: gymWeeklyScore, max: 10, done: gymToday, isGymDay, sessionsLast7: gymSessionsInLast7, scheduledLast7: gymDaysScheduledInLast7 },
      supplements: { score: supplementsScore, max: 12, taken: supplementsTakenToday, total: supplementsList.length },
    },
    mood: { energy, mood },
    today,
    weeklyAdherence,
    adherence,
  });
}
