import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const DEFAULT_DATA = { habits: {}, lastReset: null };
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

// GET /api/habits - Get habits data
export async function GET() {
  const data = (await storage.get("habits")) ?? DEFAULT_DATA;
  return NextResponse.json({ ...data, defaults: HABIT_DEFAULTS });
}

// POST /api/habits - Toggle or set habit
export async function POST(req: Request) {
  const body = await req.json();
  const { habitId, completed, date, batch } = body;
  const data = (await storage.get("habits")) ?? DEFAULT_DATA;

  if (batch && date) {
    const dateStr = date;
    if (!data.habits[dateStr]) data.habits[dateStr] = {};
    for (const item of batch) {
      data.habits[dateStr][item.habitId] = item.completed;
    }
    await storage.set("habits", data);
    const dayHabits = data.habits[dateStr] || {};
    const completedCount = HABIT_DEFAULTS.filter(h => dayHabits[h.id]).length;
    return NextResponse.json({ success: true, completedCount, total: HABIT_DEFAULTS.length });
  }

  const dateStr = date || new Date().toISOString().split("T")[0];
  if (!data.habits[dateStr]) data.habits[dateStr] = {};
  if (completed !== undefined) {
    data.habits[dateStr][habitId] = completed;
  }
  await storage.set("habits", data);

  const todayHabits = data.habits[dateStr] || {};
  const completedCount = HABIT_DEFAULTS.filter(h => todayHabits[h.id]).length;
  return NextResponse.json({ success: true, completedCount, total: HABIT_DEFAULTS.length });
}
