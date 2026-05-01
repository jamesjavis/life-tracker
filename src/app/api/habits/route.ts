import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { berlinDateStr } from "@/lib/date";

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
// Reconstructs entries[] from habits{} for backward compatibility with consumers
// that expect the old {entries: [{date, completed}]} format.
export async function GET() {
  const data = (await storage.get("habits")) ?? DEFAULT_DATA;
  // Build entries array from habits object (new format → old format)
  const entries = Object.entries(data.habits || {}).map(([date, dayHabits]) => ({
    date,
    completed: Object.entries(dayHabits as Record<string, boolean>)
      .filter(([, v]) => v)
      .map(([k]) => k),
    total: HABIT_DEFAULTS.length,
  })).sort((a, b) => a.date.localeCompare(b.date));
  return NextResponse.json({ habits: data.habits, entries, lastReset: data.lastReset, defaults: HABIT_DEFAULTS });
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

  const dateStr = date || berlinDateStr();
  if (!data.habits[dateStr]) data.habits[dateStr] = {};
  if (completed !== undefined) {
    data.habits[dateStr][habitId] = completed;
    // Mirror to entries[] for backward compatibility with direct storage consumers
    const entry = data.entries?.find((e: any) => e.date === dateStr);
    const completedSet = new Set(entry?.completed || []);
    if (completed) completedSet.add(habitId); else completedSet.delete(habitId);
    const completedArr = [...completedSet];
    if (entry) { entry.completed = completedArr; entry.total = HABIT_DEFAULTS.length; }
    else if (completedArr.length > 0) { data.entries = data.entries || []; data.entries.push({ date: dateStr, completed: completedArr, total: HABIT_DEFAULTS.length }); }
  }
  await storage.set("habits", data);

  const todayHabits = data.habits[dateStr] || {};
  const completedCount = HABIT_DEFAULTS.filter(h => todayHabits[h.id]).length;
  return NextResponse.json({ success: true, completedCount, total: HABIT_DEFAULTS.length });
}
