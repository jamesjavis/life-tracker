import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "habits.json");

const HABIT_DEFAULTS = [
  { id: "yoga", label: "Yoga", emoji: "🧘" },
  { id: "meditation", label: "Meditation", emoji: "🧘‍♂️" },
  { id: "gym", label: "Gym", emoji: "💪" },
  { id: "bauchworkout", label: "Bauch", emoji: "🏋️" },
  { id: "lesen", label: "Lesen", emoji: "📚" },
  { id: "creatin", label: "Creatin", emoji: "💊" },
  { id: "pushups", label: "Push-ups", emoji: "💨" },
  { id: "atem", label: "Atemübung", emoji: "🌬️" },
  { id: "smoothie", label: "Smoothie", emoji: "🥤" },
];

function ensureDir(filepath: string) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readHabits() {
  ensureDir(DATA_FILE);
  if (!fs.existsSync(DATA_FILE)) return { habits: {} };
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

// GET /api/habit-history?days=30
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "90");

  const data = readHabits();
  const habitsData = data.habits || {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build last N days
  const history: Record<string, Record<string, boolean>> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    history[dateStr] = habitsData[dateStr] || {};
  }

  // Compute daily completion percentage
  const dailyCompletion: Record<string, number> = {};
  for (const [dateStr, dayHabits] of Object.entries(history)) {
    const completed = HABIT_DEFAULTS.filter(h => dayHabits[h.id]).length;
    dailyCompletion[dateStr] = Math.round((completed / HABIT_DEFAULTS.length) * 100);
  }

  // Compute weekly completion (for week-over-week comparison)
  const weeks: Array<Array<{ date: string; completion: number; completed: number; total: number }>> = [];
  const dates = Object.keys(history).sort();
  let currentWeek: Array<{ date: string; completion: number; completed: number; total: number }> = [];

  for (const dateStr of dates) {
    const completed = HABIT_DEFAULTS.filter(h => history[dateStr][h.id]).length;
    const completion = Math.round((completed / HABIT_DEFAULTS.length) * 100);

    const d = new Date(dateStr);
    const dow = d.getDay(); // 0=Sun

    // Start new week on Monday
    if (dow === 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push({ date: dateStr, completion, completed, total: HABIT_DEFAULTS.length });
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  // Overall stats
  const totalDays = dates.length;
  const perfectDays = Object.values(dailyCompletion).filter(c => c === 100).length;
  const avgCompletion = Math.round(Object.values(dailyCompletion).reduce((a, b) => a + b, 0) / totalDays);

  // Longest perfect streak
  let longestPerfect = 0;
  let tempPerfect = 0;
  for (const dateStr of dates) {
    if (dailyCompletion[dateStr] === 100) {
      tempPerfect++;
      if (tempPerfect > longestPerfect) longestPerfect = tempPerfect;
    } else {
      tempPerfect = 0;
    }
  }

  return NextResponse.json({
    habits: HABIT_DEFAULTS,
    history,
    dailyCompletion,
    weeks,
    stats: {
      totalDays,
      perfectDays,
      avgCompletion,
      longestPerfect,
    }
  });
}
