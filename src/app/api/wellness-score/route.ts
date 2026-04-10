import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function readJson(filename: string) {
  const file = path.join(process.cwd(), "data", filename);
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch { return null; }
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// GET /api/wellness-score — returns a single 0-100 wellness score for today
export async function GET() {
  const day = today();
  const yd = yesterday();

  // 1. Habits score (30% of total)
  const habitsRaw = readJson("habits.json");
  const habitsToday = habitsRaw?.habits?.[day] || {};
  const habitsDone = Object.values(habitsToday).filter(Boolean).length;
  const totalHabits = 9;
  const habitsScore = Math.round((habitsDone / totalHabits) * 100);

  // 2. Gym score (20% of total)
  const gymRaw = readJson("gym.json");
  const gymLogs: string[] = gymRaw?.logs || [];
  const gymToday = gymLogs.includes(day);
  const gymScore = gymToday ? 100 : 0;

  // 3. Sleep score (25% of total)
  const sleepRaw = readJson("sleep.json");
  const sleepEntries = sleepRaw?.entries || [];
  const lastSleep = sleepEntries.find((e: any) => e.date === yd || e.date === day);
  const sleepGoal = 8;
  const sleepHours = lastSleep?.duration || 0;
  const sleepScore = sleepHours >= sleepGoal ? 100 : Math.round((sleepHours / sleepGoal) * 100);

  // 4. Mood/Energy score (15% of total)
  const moodRaw = readJson("mood.json");
  const moodEntries = moodRaw?.entries || [];
  const lastMood = moodEntries[moodEntries.length - 1];
  const moodScore = lastMood ? Math.round(((lastMood.energy || 5) / 10) * 100) : 50;

  // 5. Water score (10% of total)
  const waterRaw = readJson("water.json");
  const waterEntries = waterRaw?.entries || [];
  const waterToday = (waterEntries as any[]).find((e: any) => e.date === day);
  const waterGlasses = waterToday?.glasses || 0;
  const waterGoal = 8;
  const waterScore = waterGlasses >= waterGoal ? 100 : Math.round((waterGlasses / waterGoal) * 100);

  // Weighted total
  const total =
    habitsScore * 0.30 +
    gymScore * 0.20 +
    sleepScore * 0.25 +
    moodScore * 0.15 +
    waterScore * 0.10;

  const score = Math.round(total);

  const breakdown = {
    habits: { score: habitsScore, done: habitsDone, total: totalHabits, label: "Habits", weight: "30%" },
    gym: { score: gymScore, done: gymToday, label: "Gym", weight: "20%" },
    sleep: { score: sleepScore, hours: sleepHours, goal: sleepGoal, label: "Sleep", weight: "25%" },
    mood: { score: moodScore, label: "Energy", weight: "15%" },
    water: { score: waterScore, glasses: waterGlasses, goal: waterGoal, label: "Water", weight: "10%" },
  };

  let tier = "😴";
  let tierLabel = "Needs Work";
  let tierColor = "text-red-400";
  if (score >= 80) { tier = "⚡"; tierLabel = "Energized"; tierColor = "text-emerald-400"; }
  else if (score >= 60) { tier = "💪"; tierLabel = "Good"; tierColor = "text-green-400"; }
  else if (score >= 40) { tier = "😐"; tierLabel = "Okay"; tierColor = "text-amber-400"; }

  return NextResponse.json({ score, tier, tierLabel, tierColor, breakdown, date: day });
}
