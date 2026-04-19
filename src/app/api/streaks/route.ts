import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const HABIT_IDS = ["yoga", "meditation", "gym", "bauchworkout", "lesen", "creatin", "pushups", "atem", "smoothie"];

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
  let current = 0;
  let checkDate = new Date(today);
  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (habitsData[dateStr]?.[habitId]) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }
  const todayStr = today.toISOString().split("T")[0];
  if (!habitsData[todayStr]?.[habitId] && current === 0) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let yCheck = new Date(yesterday);
    while (true) {
      const dateStr = yCheck.toISOString().split("T")[0];
      if (habitsData[dateStr]?.[habitId]) { current++; yCheck.setDate(yCheck.getDate() - 1); }
      else break;
    }
  }
  const allDates = Object.keys(habitsData).sort();
  let longest = 0, tempStreak = 0;
  for (const dateStr of allDates) {
    if (habitsData[dateStr]?.[habitId]) { tempStreak++; if (tempStreak > longest) longest = tempStreak; }
    else tempStreak = 0;
  }
  return { current, longest, last7 };
}

// GET /api/streaks - Get all streaks
export async function GET() {
  const habitsData = (await storage.get("habits")) ?? { habits: {} };
  const habitsStreaks = (await storage.get("streaks")) ?? {};
  const result: Record<string, any> = {};

  for (const habitId of HABIT_IDS) {
    const streak = calculateStreak(habitId, habitsData.habits || {});
    result[habitId] = streak;
    if (streak.longest > (habitsStreaks[habitId]?.longest || 0)) {
      habitsStreaks[habitId] = { ...habitsStreaks[habitId], longest: streak.longest };
    }
  }
  await storage.set("streaks", habitsStreaks);
  return NextResponse.json({ streaks: result });
}
