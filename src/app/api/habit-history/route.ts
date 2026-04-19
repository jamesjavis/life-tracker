import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const HABIT_IDS = ["yoga", "meditation", "gym", "bauchworkout", "lesen", "creatin", "pushups", "atem", "smoothie"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");
  const habitsData = (await storage.get("habits")) ?? { habits: {} };
  const habits = habitsData.habits || {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const result: any[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayHabits = habits[dateStr] || {};
    result.push({ date: dateStr, ...Object.fromEntries(HABIT_IDS.map(id => [id, Boolean(dayHabits[id])])) });
  }
  const habitStats = HABIT_IDS.map(id => {
    const done = result.filter(r => r[id]).length;
    return { id, done, total: days, rate: Math.round(done / days * 100) };
  });
  return NextResponse.json({ days: result, stats: habitStats });
}
