import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "habits.json");
const STREAKS_FILE = path.join(process.cwd(), "data", "streaks.json");

function ensureDir(filepath: string) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readHabits() {
  ensureDir(DATA_FILE);
  if (!fs.existsSync(DATA_FILE)) return { habits: {} };
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeStreaks(data: any) {
  ensureDir(STREAKS_FILE);
  fs.writeFileSync(STREAKS_FILE, JSON.stringify(data, null, 2));
}

function readStreaks() {
  ensureDir(STREAKS_FILE);
  if (!fs.existsSync(STREAKS_FILE)) return {};
  return JSON.parse(fs.readFileSync(STREAKS_FILE, "utf-8"));
}

function calculateStreak(habitId: string, habitsData: Record<string, Record<string, boolean>>): { current: number; longest: number; last7: boolean[] } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last7: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    last7.push(Boolean(habitsData[dateStr]?.[habitId]));
  }

  // Calculate current streak (consecutive days ending today or yesterday)
  let current = 0;
  let checkDate = new Date(today);

  // Start from today and go backwards
  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (habitsData[dateStr]?.[habitId]) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // If no streak today, check if yesterday started a streak
  const todayStr = today.toISOString().split("T")[0];
  if (!habitsData[todayStr]?.[habitId] && current === 0) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let yCheck = new Date(yesterday);
    while (true) {
      const dateStr = yCheck.toISOString().split("T")[0];
      if (habitsData[dateStr]?.[habitId]) {
        current++;
        yCheck.setDate(yCheck.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak ever
  const allDates = Object.keys(habitsData).sort();
  let longest = 0;
  let tempStreak = 0;

  for (const dateStr of allDates) {
    if (habitsData[dateStr]?.[habitId]) {
      tempStreak++;
      if (tempStreak > longest) longest = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  return { current, longest, last7 };
}

// GET /api/streaks - Get all streaks
export async function GET() {
  const habitsData = readHabits();
  const habitsStreaks = readStreaks();

  const HABIT_IDS = ["yoga", "meditation", "gym", "bauchworkout", "lesen", "creatin", "pushups", "atem", "smoothie"];

  const result: Record<string, any> = {};

  for (const habitId of HABIT_IDS) {
    const streak = calculateStreak(habitId, habitsData.habits || {});
    result[habitId] = streak;

    // Persist longest if improved
    if (streak.longest > (habitsStreaks[habitId]?.longest || 0)) {
      habitsStreaks[habitId] = { ...habitsStreaks[habitId], longest: streak.longest };
    }
  }

  writeStreaks(habitsStreaks);

  return NextResponse.json({ streaks: result });
}