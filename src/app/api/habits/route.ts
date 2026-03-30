import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "habits.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return { habits: {}, lastReset: null };
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const HABIT_DEFAULTS = [
  { id: "duolingo", label: "Duolingo", emoji: "🇪🇸" },
  { id: "yoga", label: "Yoga", emoji: "🧘" },
  { id: "meditation", label: "Meditation", emoji: "🧘‍♂️" },
  { id: "gym", label: "Gym", emoji: "💪" },
  { id: "lesen", label: "Lesen", emoji: "📚" },
  { id: "creatin", label: "Creatin", emoji: "💊" },
  { id: "pushups", label: "Push-ups", emoji: "💨" },
  { id: "atem", label: "Atemübung", emoji: "🌬️" },
  { id: "smoothie", label: "Smoothie", emoji: "🥤" },
];

// GET /api/habits - Get habits data
export async function GET() {
  const data = readData();
  return NextResponse.json({ ...data, defaults: HABIT_DEFAULTS });
}

// POST /api/habits - Toggle or set habit
export async function POST(req: Request) {
  const { habitId, completed, date } = await req.json();
  const data = readData();
  const dateStr = date || new Date().toISOString().split("T")[0];

  if (!data.habits[dateStr]) data.habits[dateStr] = {};

  if (completed !== undefined) {
    data.habits[dateStr][habitId] = completed;
  }

  writeData(data);

  // Calculate today's completed count
  const todayHabits = data.habits[dateStr] || {};
  const completedCount = HABIT_DEFAULTS.filter(h => todayHabits[h.id]).length;

  return NextResponse.json({ success: true, completedCount, total: HABIT_DEFAULTS.length });
}